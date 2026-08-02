"use client";

import {
  Archive,
  FolderKanban,
  Group,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveProjectGroupAction,
  createProjectGroupAction,
  updateProjectGroupAction,
} from "@/app/(workspace)/projects/group-actions";
import { Input, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ProjectGroupActionResult } from "@/lib/project-groups/project-group.schemas";

type ManagedProject = {
  id: string;
  code: string;
  name: string;
};

type ProjectGroupSummary = {
  id: string;
  name: string;
  description: string | null;
  colorToken: string;
  sortOrder: number;
  projects: ManagedProject[];
};

type GroupFormState = {
  name: string;
  description: string;
  colorToken: string;
  sortOrder: number;
  projectIds: string[];
};

const emptyForm: GroupFormState = {
  name: "",
  description: "",
  colorToken: "#7157e8",
  sortOrder: 10,
  projectIds: [],
};

export function ProjectGroupManager({
  groups,
  projects,
}: {
  groups: ProjectGroupSummary[];
  projects: ManagedProject[];
}) {
  const router = useRouter();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editGroup = (group: ProjectGroupSummary) => {
    setEditingGroupId(group.id);
    setForm({
      name: group.name,
      description: group.description ?? "",
      colorToken: group.colorToken,
      sortOrder: group.sortOrder,
      projectIds: group.projects.map(({ id }) => id),
    });
    setMessage(null);
  };

  const resetForm = () => {
    setEditingGroupId(null);
    setForm(emptyForm);
    setMessage(null);
  };

  const toggleProject = (projectId: string) => {
    setForm((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId],
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result: ProjectGroupActionResult = editingGroupId
        ? await updateProjectGroupAction({
            ...form,
            groupId: editingGroupId,
          })
        : await createProjectGroupAction(form);

      if (!result.success) {
        const fieldMessage = result.fieldErrors
          ? Object.values(result.fieldErrors).flat().find(Boolean)
          : undefined;
        setMessage(
          fieldMessage ??
            result.message ??
            "The project group could not be saved.",
        );
        return;
      }

      resetForm();
      router.refresh();
    });
  };

  const archive = (group: ProjectGroupSummary) => {
    if (!window.confirm(`Archive the “${group.name}” project group?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await archiveProjectGroupAction({ groupId: group.id });
      if (!result.success) {
        setMessage(result.message ?? "The project group could not be archived.");
        return;
      }
      if (editingGroupId === group.id) resetForm();
      router.refresh();
    });
  };

  return (
    <Card className="border-[#ddd8ff] shadow-[0_8px_24px_rgba(99,80,201,0.06)]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#efebff] text-[#6350c9]">
              <Group className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Project groups</CardTitle>
              <CardDescription>
                Organize related projects under a shared workspace label. Groups never change project access.
              </CardDescription>
            </div>
          </div>
          {editingGroupId ? (
            <Button type="button" size="sm" variant="outline" onClick={resetForm}>
              <Plus className="size-4" aria-hidden="true" />
              New group
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[var(--orbit-text)]">
                  {editingGroupId ? "Edit group" : "Create group"}
                </h4>
                <p className="mt-1 text-xs text-[var(--orbit-text-subtle)]">
                  {editingGroupId
                    ? "Rename the group or move projects between groups."
                    : "Create a named container for related projects."}
                </p>
              </div>
              {editingGroupId ? (
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--orbit-text-subtle)] hover:bg-[var(--orbit-surface-muted)] hover:text-[var(--orbit-text)]"
                  onClick={resetForm}
                  aria-label="Cancel group editing"
                  title="Cancel"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {message ? (
              <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                {message}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="project-group-name">Group name</Label>
                <Input
                  id="project-group-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. PMS Release 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-group-order">Order</Label>
                <Input
                  id="project-group-order"
                  type="number"
                  min={0}
                  max={10000}
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-group-description">Description</Label>
              <Textarea
                id="project-group-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional context for this portfolio group"
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-group-color">Accent colour</Label>
              <div className="flex items-center gap-3">
                <input
                  id="project-group-color"
                  type="color"
                  value={form.colorToken}
                  onChange={(event) => setForm((current) => ({ ...current, colorToken: event.target.value }))}
                  className="size-9 cursor-pointer rounded-lg border border-[var(--orbit-border)] bg-white p-1"
                  aria-label="Group accent colour"
                />
                <span className="font-mono text-xs text-[var(--orbit-text-muted)]">{form.colorToken}</span>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[var(--orbit-text)]">Projects in this group</legend>
              <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] p-2">
                {projects.length ? (
                  projects.map((project) => (
                    <label key={project.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-white">
                      <input
                        type="checkbox"
                        checked={form.projectIds.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        className="size-4 rounded border-[var(--orbit-border)] accent-[var(--orbit-purple)]"
                      />
                      <span className="min-w-0 truncate text-[var(--orbit-text)]">
                        <span className="font-mono text-[0.65rem] text-[var(--orbit-text-subtle)]">{project.code}</span>{" "}
                        {project.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="px-2 py-3 text-xs text-[var(--orbit-text-subtle)]">Create a project first to assign it to a group.</p>
                )}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2">
              {editingGroupId ? (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending || !form.name.trim()}>
                {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : editingGroupId ? <Save aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {isPending ? "Saving…" : editingGroupId ? "Save group" : "Create group"}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-[var(--orbit-text)]">Current groups</h4>
              <span className="rounded-full border border-[var(--orbit-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--orbit-text-muted)]">
                {groups.length} {groups.length === 1 ? "group" : "groups"}
              </span>
            </div>
            {groups.length ? (
              <div className="space-y-2.5">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-xl border border-[var(--orbit-border)] bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.colorToken }} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--orbit-text)]">{group.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--orbit-text-subtle)]">
                            {group.projects.length} {group.projects.length === 1 ? "project" : "projects"}
                            {group.description ? ` · ${group.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => editGroup(group)} aria-label={`Edit ${group.name}`} title="Edit group">
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => archive(group)} disabled={isPending} aria-label={`Archive ${group.name}`} title="Archive group">
                          <Archive aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    {group.projects.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {group.projects.map((project) => (
                          <span key={project.id} className="inline-flex items-center gap-1 rounded-md bg-[var(--orbit-surface-muted)] px-2 py-1 text-[0.68rem] font-medium text-[var(--orbit-text-muted)]">
                            <FolderKanban className="size-3" aria-hidden="true" />
                            {project.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--orbit-text-subtle)]">No projects assigned yet.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] px-4 py-8 text-center">
                <Group className="mx-auto size-5 text-[var(--orbit-text-subtle)]" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-[var(--orbit-text)]">No groups created</p>
                <p className="mt-1 text-xs text-[var(--orbit-text-subtle)]">Create the first group to organize this workspace.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
