import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";

export default async function NewProjectPage() {
  const context = await requirePagePermission(PERMISSIONS.PROJECT_CREATE);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="Create project"
        description="Establish the project record and its initial Project Manager membership."
      />
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Dates and progress are validated on both the client and server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            canManageVisibility={hasPermission(
              context.user,
              PERMISSIONS.SYSTEM_MANAGE,
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
