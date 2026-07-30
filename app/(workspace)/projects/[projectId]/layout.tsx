import type { ReactNode } from "react";

import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;

  return (
    <>
      <ProjectWorkspaceNav projectId={projectId} />
      {children}
    </>
  );
}
