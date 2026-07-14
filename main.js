// Orbit — lightweight in-browser project and milestone dashboard.

const RISK_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };
const STATUS_LABEL = {
  pending: 'Not started',
  inprogress: 'In progress',
  done: 'Completed',
  blocked: 'Blocked'
};
const PROJECT_STATUS_LABEL = {
  planning: 'Planning',
  active: 'Active',
  onhold: 'On hold',
  done: 'Completed'
};

let state = { projects: [], milestones: [], selectedProjectId: null };
let editingProjectId = null;
let editingMilestoneId = null;
let subMilestoneDraft = [];
let confirmationResolver = null;
let confirmationTrigger = null;

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loadState() {
  const response = await fetch('/api/state');
  if (!response.ok) throw new Error('Could not load project data');
  const saved = await response.json();
  state.projects = saved.projects;
  state.milestones = saved.milestones.map(milestone => {
    const normalized = {
      ...milestone,
      subMilestones: Array.isArray(milestone.subMilestones) ? milestone.subMilestones : []
    };
    return { ...normalized, progress: milestoneProgress(normalized) };
  });
  state.selectedProjectId = state.projects[0]?.id || null;
}

async function persistState() {
  state.milestones.forEach(milestone => {
    milestone.progress = milestoneProgress(milestone);
  });
  const response = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects: state.projects, milestones: state.milestones })
  });
  if (!response.ok) throw new Error('Could not save changes');
}

function daysBetween(startDate, endDate) {
  return Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000));
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short'
  });
}

function getProject(id) {
  return state.projects.find(project => project.id === id);
}

function getMilestones(projectId) {
  return state.milestones
    .filter(milestone => milestone.projectId === projectId)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function highestRisk(milestones) {
  if (milestones.some(item => item.risk === 'high' && item.status !== 'done')) return 'high';
  if (milestones.some(item => item.risk === 'medium' && item.status !== 'done')) return 'medium';
  if (milestones.length) return 'low';
  return 'none';
}

function projectProgress(milestones) {
  if (!milestones.length) return 0;
  return Math.round(milestones.reduce((sum, item) => sum + milestoneProgress(item), 0) / milestones.length);
}

function milestoneProgress(milestone) {
  const items = Array.isArray(milestone.subMilestones) ? milestone.subMilestones : [];
  if (!items.length) return milestone.status === 'done' ? 100 : 0;
  return Math.round((items.filter(item => item.done).length / items.length) * 100);
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value ?? '';
  return element.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add('hidden'), 2400);
}

function setModalVisibility(overlayId, visible) {
  document.getElementById(overlayId).classList.toggle('hidden', !visible);
  const anyModalOpen = [...document.querySelectorAll('.modal-overlay')]
    .some(overlay => !overlay.classList.contains('hidden'));
  document.body.classList.toggle('modal-open', anyModalOpen);
}

function requestConfirmation({ title, message, confirmLabel = 'Delete' }) {
  if (confirmationResolver) return Promise.resolve(false);
  confirmationTrigger = document.activeElement;
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  document.getElementById('acceptConfirmBtn').textContent = confirmLabel;
  setModalVisibility('confirmModalOverlay', true);
  requestAnimationFrame(() => document.getElementById('acceptConfirmBtn').focus());
  return new Promise(resolve => {
    confirmationResolver = resolve;
  });
}

function resolveConfirmation(accepted) {
  if (!confirmationResolver) return;
  const resolve = confirmationResolver;
  confirmationResolver = null;
  setModalVisibility('confirmModalOverlay', false);
  resolve(accepted);
  if (confirmationTrigger?.focus) confirmationTrigger.focus();
  confirmationTrigger = null;
}

function renderSidebar() {
  const list = document.getElementById('projectList');
  const summary = document.getElementById('sidebarSummary');
  const highRiskCount = state.milestones.filter(item => item.risk === 'high' && item.status !== 'done').length;

  summary.innerHTML = `
    <div class="summary-chip"><span class="n">${state.projects.length}</span><span class="l">Projects</span></div>
    <div class="summary-chip"><span class="n">${state.milestones.length}</span><span class="l">Milestones</span></div>
    <div class="summary-chip"><span class="n ${highRiskCount ? 'danger-text' : ''}">${highRiskCount}</span><span class="l">High risk</span></div>
  `;

  if (!state.projects.length) {
    list.innerHTML = '<p class="sidebar-empty">No projects yet. Create one to get started.</p>';
    return;
  }

  list.innerHTML = state.projects.map(project => {
    const milestones = getMilestones(project.id);
    const percentage = projectProgress(milestones);
    const risk = highestRisk(milestones);
    const active = project.id === state.selectedProjectId;

    return `
      <button class="project-item ${active ? 'active' : ''}" data-id="${project.id}" aria-pressed="${active}">
        <span class="project-item-top">
          <span class="project-item-name">${escapeHtml(project.name)}</span>
          <span class="dot dot-${risk}" title="Highest risk: ${RISK_LABEL[risk] || 'None'}"></span>
        </span>
        <span class="project-item-meta"><span>${milestones.length} milestones</span><span>${percentage}% done</span></span>
        <span class="mini-progress"><span class="mini-progress-fill" style="width:${percentage}%"></span></span>
      </button>
    `;
  }).join('');

  list.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', () => {
      state.selectedProjectId = item.dataset.id;
      renderAll();
    });
  });
}

function renderProjectView() {
  const project = getProject(state.selectedProjectId);
  const emptyState = document.getElementById('emptyState');
  const projectView = document.getElementById('projectView');

  if (!project) {
    emptyState.classList.remove('hidden');
    projectView.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  projectView.classList.remove('hidden');
  document.getElementById('projectName').textContent = project.name;
  document.getElementById('projectDesc').textContent = project.description || 'No project description has been added.';

  const statusBadge = document.getElementById('projectStatusBadge');
  statusBadge.textContent = PROJECT_STATUS_LABEL[project.status];
  statusBadge.className = `eyebrow status-${project.status}`;

  const milestones = getMilestones(project.id);
  const progress = projectProgress(milestones);
  document.getElementById('statDuration').textContent = daysBetween(project.startDate, project.endDate);
  document.getElementById('statMilestones').textContent = milestones.length;
  document.getElementById('statDone').textContent = `${progress}%`;

  const riskCounts = {
    low: milestones.filter(item => item.risk === 'low').length,
    medium: milestones.filter(item => item.risk === 'medium').length,
    high: milestones.filter(item => item.risk === 'high').length
  };
  const total = milestones.length || 1;
  document.getElementById('riskMix').innerHTML = milestones.length
    ? Object.entries(riskCounts).map(([risk, count]) =>
      `<span class="risk-${risk}" style="width:${(count / total) * 100}%" title="${RISK_LABEL[risk]}: ${count}"></span>`
    ).join('')
    : '<span class="risk-none" style="width:100%"></span>';

  renderTimeline(project, milestones);
  renderMilestoneList(milestones);
}

function renderTimeline(project, milestones) {
  const timeline = document.getElementById('timeline');
  if (!milestones.length) {
    timeline.innerHTML = '<div class="timeline-empty">No milestones yet. Add one to build your project schedule.</div>';
    return;
  }

  const projectStart = new Date(project.startDate).getTime();
  const projectEnd = new Date(project.endDate).getTime();
  const projectSpan = Math.max(1, projectEnd - projectStart);

  timeline.innerHTML = milestones.map(milestone => {
    const milestoneStart = new Date(milestone.startDate).getTime();
    const milestoneEnd = new Date(milestone.endDate).getTime();
    const left = Math.min(97, Math.max(0, ((milestoneStart - projectStart) / projectSpan) * 100));
    const width = Math.max(3, Math.min(100 - left, ((milestoneEnd - milestoneStart) / projectSpan) * 100));

    return `
      <div class="timeline-row">
        <div class="timeline-label" title="${escapeHtml(milestone.name)}">${escapeHtml(milestone.name)}</div>
        <div class="timeline-track">
          <button class="timeline-bar bar-${milestone.risk} ${milestone.status === 'done' ? 'bar-done' : ''}" data-id="${milestone.id}" style="left:${left}%;width:${width}%" aria-label="Edit ${escapeHtml(milestone.name)}">
            <span>${daysBetween(milestone.startDate, milestone.endDate)}d</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  timeline.querySelectorAll('.timeline-bar').forEach(bar => {
    bar.addEventListener('click', () => openMilestoneModal(bar.dataset.id));
  });
}

function renderMilestoneList(milestones) {
  const list = document.getElementById('milestoneList');
  if (!milestones.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = milestones.map(milestone => {
    const progress = milestoneProgress(milestone);
    return `
    <button class="milestone-card" data-id="${milestone.id}">
      <span class="ms-copy">
        <span class="ms-name">${escapeHtml(milestone.name)}</span>
        ${milestone.note ? `<span class="ms-note">${escapeHtml(milestone.note)}</span>` : ''}
        ${milestone.subMilestones.length ? `<span class="sub-count">${milestone.subMilestones.filter(item => item.done).length}/${milestone.subMilestones.length} sub-milestones</span>` : ''}
        <span class="ms-progress"><span style="width:${progress}%"></span></span>
      </span>
      <span class="ms-dates">${formatDate(milestone.startDate)} — ${formatDate(milestone.endDate)}</span>
      <span class="ms-duration">${progress}%</span>
      <span class="badge badge-${milestone.risk}">${RISK_LABEL[milestone.risk]} risk</span>
      <span class="status-pill st-${milestone.status}">${STATUS_LABEL[milestone.status]}</span>
    </button>`;
  }).join('');

  list.querySelectorAll('.milestone-card').forEach(card => {
    card.addEventListener('click', () => openMilestoneModal(card.dataset.id));
  });
}

function renderAll() {
  renderSidebar();
  renderProjectView();
}

function openProjectModal(projectId) {
  editingProjectId = projectId || null;
  const project = projectId ? getProject(projectId) : null;
  document.getElementById('projectModalTitle').textContent = project ? 'Edit project' : 'New project';
  document.getElementById('pmError').classList.add('hidden');
  document.getElementById('pmName').value = project?.name || '';
  document.getElementById('pmDesc').value = project?.description || '';
  document.getElementById('pmStart').value = project?.startDate || todayPlus(0);
  document.getElementById('pmEnd').value = project?.endDate || todayPlus(30);
  document.getElementById('pmStatus').value = project?.status || 'planning';
  setModalVisibility('projectModalOverlay', true);
  document.getElementById('pmName').focus();
}

function closeProjectModal() {
  setModalVisibility('projectModalOverlay', false);
}

async function saveProject() {
  const name = document.getElementById('pmName').value.trim();
  const description = document.getElementById('pmDesc').value.trim();
  const startDate = document.getElementById('pmStart').value;
  const endDate = document.getElementById('pmEnd').value;
  const status = document.getElementById('pmStatus').value;
  const error = document.getElementById('pmError');

  if (!name) return showFormError(error, 'Enter a project name.');
  if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
    return showFormError(error, 'The end date must be on or after the start date.');
  }

  if (editingProjectId) {
    Object.assign(getProject(editingProjectId), { name, description, startDate, endDate, status });
  } else {
    const id = uid('proj');
    state.projects.push({ id, name, description, startDate, endDate, status });
    state.selectedProjectId = id;
  }
  try {
    await persistState();
    showToast(editingProjectId ? 'Project changes saved' : 'Project created');
    closeProjectModal();
    renderAll();
  } catch (networkError) {
    await loadState();
    showFormError(error, networkError.message);
    renderAll();
  }
}

async function deleteProject() {
  if (!state.selectedProjectId) return;
  const project = getProject(state.selectedProjectId);
  const accepted = await requestConfirmation({
    title: `Delete ${project.name}?`,
    message: 'This will permanently delete the project and all of its milestones. This action cannot be undone.',
    confirmLabel: 'Delete project'
  });
  if (!accepted) return;
  const id = state.selectedProjectId;
  state.projects = state.projects.filter(project => project.id !== id);
  state.milestones = state.milestones.filter(milestone => milestone.projectId !== id);
  state.selectedProjectId = state.projects[0]?.id || null;
  try {
    await persistState();
    showToast('Project deleted');
    renderAll();
  } catch (error) {
    await loadState();
    showToast(error.message);
    renderAll();
  }
}

function openMilestoneModal(milestoneId) {
  editingMilestoneId = milestoneId || null;
  const milestone = milestoneId ? state.milestones.find(item => item.id === milestoneId) : null;
  const project = getProject(state.selectedProjectId);
  document.getElementById('milestoneModalTitle').textContent = milestone ? 'Edit milestone' : 'New milestone';
  document.getElementById('mmError').classList.add('hidden');
  document.getElementById('mmName').value = milestone?.name || '';
  document.getElementById('mmStart').value = milestone?.startDate || project?.startDate || todayPlus(0);
  document.getElementById('mmEnd').value = milestone?.endDate || project?.endDate || todayPlus(14);
  document.getElementById('mmRisk').value = milestone?.risk || 'medium';
  document.getElementById('mmStatus').value = milestone?.status || 'pending';
  document.getElementById('mmNote').value = milestone?.note || '';
  subMilestoneDraft = structuredClone(milestone?.subMilestones || []);
  document.getElementById('subMilestoneForm').classList.add('hidden');
  document.getElementById('subMilestoneName').value = '';
  renderSubMilestoneEditor();
  updateDraftProgress();
  document.getElementById('deleteMilestoneBtn').classList.toggle('hidden', !milestone);
  setModalVisibility('milestoneModalOverlay', true);
  document.getElementById('mmName').focus();
}

function closeMilestoneModal() {
  setModalVisibility('milestoneModalOverlay', false);
}

function renderSubMilestoneEditor() {
  const list = document.getElementById('subMilestoneList');
  list.innerHTML = subMilestoneDraft.length ? subMilestoneDraft.map(item => `
    <div class="submilestone-item">
      <label><input type="checkbox" data-sub-toggle="${item.id}" ${item.done ? 'checked' : ''}><span>${escapeHtml(item.name)}</span></label>
      <button type="button" class="icon-btn" data-sub-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">×</button>
    </div>
  `).join('') : '<p>No sub-milestones added.</p>';

  list.querySelectorAll('[data-sub-toggle]').forEach(input => {
    input.addEventListener('change', () => {
      const item = subMilestoneDraft.find(entry => entry.id === input.dataset.subToggle);
      if (item) item.done = input.checked;
      updateDraftProgress();
    });
  });
  list.querySelectorAll('[data-sub-delete]').forEach(button => {
    button.addEventListener('click', () => {
      subMilestoneDraft = subMilestoneDraft.filter(item => item.id !== button.dataset.subDelete);
      renderSubMilestoneEditor();
      updateDraftProgress();
    });
  });
}

function updateDraftProgress() {
  const progress = milestoneProgress({
    status: document.getElementById('mmStatus').value,
    subMilestones: subMilestoneDraft
  });
  document.getElementById('mmProgressValue').textContent = `${progress}%`;
  document.getElementById('mmProgressBar').style.width = `${progress}%`;
}

function addSubMilestone() {
  const input = document.getElementById('subMilestoneName');
  const name = input.value.trim();
  if (!name) return input.focus();
  subMilestoneDraft.push({ id: uid('sub'), name, done: false });
  input.value = '';
  renderSubMilestoneEditor();
  updateDraftProgress();
  input.focus();
}

async function saveMilestone() {
  const name = document.getElementById('mmName').value.trim();
  const startDate = document.getElementById('mmStart').value;
  const endDate = document.getElementById('mmEnd').value;
  const risk = document.getElementById('mmRisk').value;
  const status = document.getElementById('mmStatus').value;
  const note = document.getElementById('mmNote').value.trim();
  const progress = milestoneProgress({ status, subMilestones: subMilestoneDraft });
  const error = document.getElementById('mmError');

  if (!name) return showFormError(error, 'Enter a milestone name.');
  if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
    return showFormError(error, 'The end date must be on or after the start date.');
  }

  if (editingMilestoneId) {
    const milestone = state.milestones.find(item => item.id === editingMilestoneId);
    Object.assign(milestone, { name, startDate, endDate, risk, status, note, progress, subMilestones: structuredClone(subMilestoneDraft) });
  } else {
    state.milestones.push({ id: uid('ms'), projectId: state.selectedProjectId, name, startDate, endDate, risk, status, note, progress, subMilestones: structuredClone(subMilestoneDraft) });
  }
  try {
    await persistState();
    showToast(editingMilestoneId ? 'Milestone changes saved' : 'Milestone created');
    closeMilestoneModal();
    renderAll();
  } catch (networkError) {
    showFormError(error, networkError.message);
    await loadState();
    renderAll();
  }
}

function showFormError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
  return false;
}

async function deleteMilestone() {
  if (!editingMilestoneId) return;
  const milestone = state.milestones.find(item => item.id === editingMilestoneId);
  const accepted = await requestConfirmation({
    title: `Delete ${milestone.name}?`,
    message: 'This will permanently delete the milestone and its sub-milestones. This action cannot be undone.',
    confirmLabel: 'Delete milestone'
  });
  if (!accepted) return;
  state.milestones = state.milestones.filter(item => item.id !== editingMilestoneId);
  try {
    await persistState();
    showToast('Milestone deleted');
    closeMilestoneModal();
    renderAll();
  } catch (error) {
    await loadState();
    showToast(error.message);
    renderAll();
  }
}

async function init() {
  try {
    await loadState();
    renderAll();
  } catch (error) {
    document.getElementById('emptyState').innerHTML = `<div class="empty-icon">!</div><h2>Could not load data</h2><p>${escapeHtml(error.message)}. Start the app with <code>npm start</code> and refresh this page.</p>`;
    return;
  }

  document.getElementById('newProjectBtn').addEventListener('click', () => openProjectModal(null));
  document.getElementById('emptyNewProjectBtn').addEventListener('click', () => openProjectModal(null));
  document.getElementById('editProjectBtn').addEventListener('click', () => openProjectModal(state.selectedProjectId));
  document.getElementById('deleteProjectBtn').addEventListener('click', deleteProject);
  document.getElementById('closeProjectModal').addEventListener('click', closeProjectModal);
  document.getElementById('cancelProjectModal').addEventListener('click', closeProjectModal);
  document.getElementById('saveProjectBtn').addEventListener('click', saveProject);
  document.getElementById('newMilestoneBtn').addEventListener('click', () => openMilestoneModal(null));
  document.getElementById('closeMilestoneModal').addEventListener('click', closeMilestoneModal);
  document.getElementById('cancelMilestoneModal').addEventListener('click', closeMilestoneModal);
  document.getElementById('saveMilestoneBtn').addEventListener('click', saveMilestone);
  document.getElementById('deleteMilestoneBtn').addEventListener('click', deleteMilestone);
  document.getElementById('cancelConfirmBtn').addEventListener('click', () => resolveConfirmation(false));
  document.getElementById('acceptConfirmBtn').addEventListener('click', () => resolveConfirmation(true));
  document.getElementById('mmStatus').addEventListener('change', updateDraftProgress);
  document.getElementById('addSubMilestoneBtn').addEventListener('click', () => {
    document.getElementById('subMilestoneForm').classList.toggle('hidden');
    document.getElementById('subMilestoneName').focus();
  });
  document.getElementById('saveSubMilestoneBtn').addEventListener('click', addSubMilestone);
  document.getElementById('subMilestoneName').addEventListener('keydown', event => {
    if (event.key === 'Enter') addSubMilestone();
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', event => {
      if (event.target !== overlay) return;
      if (overlay.id === 'projectModalOverlay') closeProjectModal();
      if (overlay.id === 'milestoneModalOverlay') closeMilestoneModal();
      if (overlay.id === 'confirmModalOverlay') resolveConfirmation(false);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!document.getElementById('confirmModalOverlay').classList.contains('hidden')) {
        resolveConfirmation(false);
        return;
      }
      closeProjectModal();
      closeMilestoneModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
