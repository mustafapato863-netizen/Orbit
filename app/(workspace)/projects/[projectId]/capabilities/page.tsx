import { Boxes, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { executionQueries } from "@/lib/execution/execution.service";
import { projectQueries } from "@/lib/projects/project.service";
import { displayEnum } from "@/lib/projects/project.utils";

export default async function CapabilitiesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, capabilities] = await Promise.all([
    projectQueries.getProject(projectId),
    executionQueries.listCapabilities(projectId),
  ]);
  if (!project) notFound();
  const canManage = hasPermission(
    context.user,
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} / Plan / Shared work`}
        title="Shared work"
        description="Common delivery work owned once and reused by every dependent milestone."
        actions={
          canManage ? (
            <Button asChild>
              <Link href={`/projects/${projectId}/capabilities/new`}>
                <Plus />
                Add shared work
              </Link>
            </Button>
          ) : undefined
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Shared work items"
          value={capabilities.length}
          description="Counted once for this project"
          icon={Boxes}
          tone="purple"
        />
        <MetricCard
          label="Milestone links"
          value={capabilities.reduce(
            (total, capability) => total + capability.milestoneLinks.length,
            0,
          )}
          description="Relational dependency references"
          icon={Boxes}
          tone="blue"
        />
        <MetricCard
          label="Blocked"
          value={capabilities.filter(({ status }) => status === "BLOCKED").length}
          description="Canonical records requiring action"
          icon={Boxes}
          tone="amber"
        />
      </section>
      {!capabilities.length ? (
        <EmptyState
          icon={Boxes}
          title="No shared work yet"
          description="Add common work once, then link it to every affected milestone."
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {capabilities.map((capability) => {
            const canUpdate =
              canManage ||
              (hasPermission(
                context.user,
                PERMISSIONS.SHARED_CAPABILITY_UPDATE_ASSIGNED,
              ) &&
                capability.owner?.id === context.user.id);
            return (
              <Card key={capability.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {capability.code}
                      </p>
                      <CardTitle className="mt-2">{capability.name}</CardTitle>
                    </div>
                    <ProjectStatusBadge
                      status={capability.status}
                      label={displayEnum(capability.status)}
                    />
                  </div>
                  <CardDescription>{capability.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">
                      Primary: {capability.primaryWorkstream.name}
                    </span>
                    {capability.supportingWorkstreams.map(({ workstream }) => (
                      <span
                        key={workstream.id}
                        className="rounded-full border bg-muted px-2.5 py-1 text-xs"
                      >
                        Supporting: {workstream.name}
                      </span>
                    ))}
                    <RiskBadge
                      level={
                        capability.riskLevel.toLowerCase() as
                          | "low"
                          | "medium"
                          | "high"
                          | "critical"
                      }
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {displayEnum(capability.deliveryStage)}
                      </span>
                      <span className="font-semibold">
                        {capability.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${capability.progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Linked milestones ({capability.milestoneLinks.length})
                    </p>
                    <ul className="mt-2 space-y-2">
                      {capability.milestoneLinks.map((link) => (
                        <li
                          key={link.milestoneId}
                          className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">
                            {link.milestone.code} — {link.milestone.name}
                          </span>
                          {link.sourceReference ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              Source: {link.sourceReference}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {canUpdate ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link
                        href={`/projects/${projectId}/capabilities/${capability.id}/edit`}
                      >
                        Edit canonical capability
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
