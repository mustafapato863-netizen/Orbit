import type { ReactNode } from "react";

import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { requireWorkspaceSession } from "@/lib/auth/authorization";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const context = await requireWorkspaceSession();

  return (
    <>
      <ProjectWorkspaceNav projectId={projectId} user={context.user} />
      {children}
    </>
  );
}
