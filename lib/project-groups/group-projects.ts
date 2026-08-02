export type GroupableProject = {
  id: string;
  projectGroup: {
    id: string;
    name: string;
    colorToken: string;
    sortOrder: number;
  } | null;
};

export type ProjectGroupSection<T extends GroupableProject> = {
  group: T["projectGroup"];
  projects: T[];
};

export function groupProjectsByProjectGroup<T extends GroupableProject>(
  projects: readonly T[],
): ProjectGroupSection<T>[] {
  const sections = new Map<string, ProjectGroupSection<T>>();

  for (const project of projects) {
    const group = project.projectGroup;
    const key = group?.id ?? "ungrouped";
    const existing = sections.get(key);

    if (existing) {
      existing.projects.push(project);
      continue;
    }

    sections.set(key, { group, projects: [project] });
  }

  return [...sections.values()].sort((left, right) => {
    if (!left.group && !right.group) return 0;
    if (!left.group) return 1;
    if (!right.group) return -1;
    return (
      left.group.sortOrder - right.group.sortOrder ||
      left.group.name.localeCompare(right.group.name)
    );
  });
}

