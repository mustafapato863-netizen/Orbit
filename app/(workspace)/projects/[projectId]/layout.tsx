import type { ReactNode } from "react";

import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const context = await requirePagePermission(
    PERMISSIONS.PROJECT_VIEW,
    projectId,
  );

  return (
    <>
      <ProjectWorkspaceNav projectId={projectId} user={context.user} />
      {children}
    </>
  );
}
