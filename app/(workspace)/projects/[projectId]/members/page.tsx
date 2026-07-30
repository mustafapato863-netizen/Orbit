import { notFound } from "next/navigation";

import { MembershipManager } from "@/components/projects/membership-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";

export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS, projectId);
  const [project, users] = await Promise.all([
    projectQueries.getProjectDetails(projectId),
    projectQueries.listAvailableUsers(),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={project.code}
        title="Project membership"
        description={`Manage access to ${project.name}. System permissions and active project membership are both required.`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Every project must retain at least one active Project Manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembershipManager
            projectId={project.id}
            members={project.members}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
