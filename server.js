const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const PROJECTS_FILE = path.join(ROOT, 'projects.json');
const DB_FILE = path.join(ROOT, 'db.json');
const STATIC_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, file);
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request body is too large');
  }
  return JSON.parse(body || '{}');
}

function send(response, status, value, type = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
}

function validState(value) {
  if (!value || !Array.isArray(value.projects) || !Array.isArray(value.milestones)) return false;
  const projectIds = new Set(value.projects.map(project => project.id));
  const milestoneIds = new Set(value.milestones.map(milestone => milestone.id));
  if (projectIds.size !== value.projects.length || milestoneIds.size !== value.milestones.length) return false;
  return value.projects.every(project => typeof project.id === 'string' && project.id && typeof project.name === 'string' && project.name.trim())
    && value.milestones.every(milestone => {
      return typeof milestone.id === 'string' && milestone.id
        && projectIds.has(milestone.projectId)
        && Array.isArray(milestone.subMilestones)
        && milestone.subMilestones.every(item => typeof item.id === 'string' && typeof item.name === 'string' && typeof item.done === 'boolean');
    });
}

function milestoneProgress(milestone) {
  if (!milestone.subMilestones.length) return milestone.status === 'done' ? 100 : 0;
  return Math.round((milestone.subMilestones.filter(item => item.done).length / milestone.subMilestones.length) * 100);
}

async function handleApi(request, response, pathname) {
  if (pathname !== '/api/state') return send(response, 404, { error: 'Not found' });

  if (request.method === 'GET') {
    const [projectStore, database] = await Promise.all([
      readJson(PROJECTS_FILE, { projects: [] }),
      readJson(DB_FILE, { milestones: [] })
    ]);
    return send(response, 200, { projects: projectStore.projects || [], milestones: database.milestones || [] });
  }

  if (request.method === 'PUT') {
    const state = await readBody(request);
    if (!validState(state)) return send(response, 400, { error: 'Invalid project state' });
    const milestones = state.milestones.map(milestone => ({
      ...milestone,
      progress: milestoneProgress(milestone)
    }));
    await Promise.all([
      writeJsonAtomic(PROJECTS_FILE, { projects: state.projects }),
      writeJsonAtomic(DB_FILE, { milestones })
    ]);
    return send(response, 200, { saved: true });
  }

  return send(response, 405, { error: 'Method not allowed' });
}

async function handleStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(ROOT, requested);
  if (!file.startsWith(`${ROOT}${path.sep}`)) return send(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
  try {
    const content = await fs.readFile(file);
    send(response, 200, content, STATIC_TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (error) {
    send(response, error.code === 'ENOENT' ? 404 : 500, 'Not found', 'text/plain; charset=utf-8');
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (pathname.startsWith('/api/')) await handleApi(request, response, pathname);
    else await handleStatic(response, pathname);
  } catch (error) {
    send(response, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(PORT, () => console.log(`Orbit is running at http://localhost:${PORT}`));
