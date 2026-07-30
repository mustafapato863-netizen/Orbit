"use client";

import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CalendarDays,
  Pencil,
  Plus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { reorderMilestoneAction } from "@/app/(workspace)/projects/actions";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskBadge } from "@/components/ui/risk-badge";
import { displayEnum } from "@/lib/projects/project.utils";

type MilestoneSummary = {
  id: string;
  code: string;
  name: string;
  businessPurpose: string | null;
  status: string;
  progress: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  releaseHorizon: "RELEASE_1" | "PHASE_2";
  startDate: Date | null;
  dueDate: Date | null;
  deliveredScope: string | null;
  remainingScope: string | null;
  currentBlockers: string | null;
  nextAction: string | null;
  firstReleaseImpact: string | null;
  workItems: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    deliveryStage: string;
    nextGate: string | null;
    startDate: Date | null;
    dueDate: Date | null;
    blocker: string | null;
    owner: { id: string; displayName: string } | null;
    primaryWorkstream: { id: string; code: string; name: string };
  }>;
  sharedCapabilityLinks: Array<{
    sourceReference: string | null;
    dependencyNotes: string | null;
    isCritical: boolean;
    sharedCapability: {
      id: string;
      code: string;
      name: string;
      status: string;
      progress: number;
      deliveryStage: string;
      blocker: string | null;
      owner: { id: string; displayName: string } | null;
      primaryWorkstream: { id: string; code: string; name: string };
    };
  }>;
};

function ScopeValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
        {value || "Not recorded"}
      </dd>
    </div>
  );
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(value)
    : "Not set";
}

export function MilestoneList({
  projectId,
  milestones,
  canManage,
  canManageWorkItems,
  canUpdateAssignedWork,
  canManageCapabilities,
  canUpdateAssignedCapabilities,
  currentUserId,
}: {
  projectId: string;
  milestones: MilestoneSummary[];
  canManage: boolean;
  canManageWorkItems: boolean;
  canUpdateAssignedWork: boolean;
  canManageCapabilities: boolean;
  canUpdateAssignedCapabilities: boolean;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!milestones.length) {
    return (
      <EmptyState
        title="No business milestones"
        description="Create the first milestone to classify Release 1 and Phase 2 business outcomes."
        action={
          canManage ? (
            <Button asChild>
              <Link href={`/projects/${projectId}/milestones/new`}>
                <Plus />
                Create milestone
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      {milestones.map((milestone, index) => (
        <Card
          key={milestone.id}
          id={`milestone-${milestone.id}`}
          className="scroll-mt-32 gap-4 py-5"
        >
          <CardHeader className="px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {milestone.code}
                  </span>
                  <span className="rounded-full border bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold">
                    {milestone.releaseHorizon === "RELEASE_1"
                      ? "Release 1"
                      : "Phase 2"}
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg">{milestone.name}</CardTitle>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {milestone.businessPurpose || "No business purpose recorded."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge
                  status={milestone.status}
                  label={displayEnum(milestone.status)}
                />
                <RiskBadge level={milestone.riskLevel.toLowerCase() as Lowercase<typeof milestone.riskLevel>} />
                {canManage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={isPending || index === 0}
                      aria-label={`Move ${milestone.name} up`}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await reorderMilestoneAction({
                            projectId,
                            milestoneId: milestone.id,
                            direction: "UP",
                          });
                          if (!result.success) {
                            setMessage(result.message ?? "Ordering failed.");
                          }
                        })
                      }
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={isPending || index === milestones.length - 1}
                      aria-label={`Move ${milestone.name} down`}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await reorderMilestoneAction({
                            projectId,
                            milestoneId: milestone.id,
                            direction: "DOWN",
                          });
                          if (!result.success) {
                            setMessage(result.message ?? "Ordering failed.");
                          }
                        })
                      }
                    >
                      <ArrowDown />
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                      >
                        <Pencil />
                        Edit
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {milestone.progress}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start date</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {milestone.startDate?.toISOString().slice(0, 10) ?? "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due date</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {milestone.dueDate?.toISOString().slice(0, 10) ?? "Not set"}
                </p>
              </div>
            </div>
            <details className="group rounded-lg border bg-muted/20">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                Business scope details
              </summary>
              <dl className="grid gap-5 border-t px-4 py-4 md:grid-cols-2">
                <ScopeValue label="Delivered scope" value={milestone.deliveredScope} />
                <ScopeValue label="Remaining scope" value={milestone.remainingScope} />
                <ScopeValue label="Current blockers" value={milestone.currentBlockers} />
                <ScopeValue label="Next action" value={milestone.nextAction} />
                <ScopeValue
                  label="First-release impact"
                  value={milestone.firstReleaseImpact}
                />
              </dl>
            </details>
            <details className="group rounded-lg border bg-muted/20">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                Delivery work ({milestone.workItems.length} specific,{" "}
                {milestone.sharedCapabilityLinks.length} shared)
              </summary>
              <div className="space-y-6 border-t px-4 py-4">
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Wrench className="size-4 text-muted-foreground" />
                        Milestone-Specific Work
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Work owned by this Business Milestone.
                      </p>
                    </div>
                    {canManageWorkItems ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/projects/${projectId}/milestones/${milestone.id}/work-items/new`}
                        >
                          <Plus />
                          Work Item
                        </Link>
                      </Button>
                    ) : null}
                  </div>

                  {milestone.workItems.length ? (
                    <div className="overflow-hidden rounded-lg border bg-background">
                      <div className="border-b bg-muted/30 px-4 py-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sub-milestone timeline
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left">
                          <thead className="bg-muted/15">
                            <tr className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <th className="px-4 py-2.5">Sub-milestone</th>
                              <th className="px-4 py-2.5">Start</th>
                              <th className="px-4 py-2.5">End</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {milestone.workItems
                              .slice()
                              .sort((left, right) => {
                                const leftTime =
                                  left.startDate?.getTime() ??
                                  left.dueDate?.getTime() ??
                                  Number.MAX_SAFE_INTEGER;
                                const rightTime =
                                  right.startDate?.getTime() ??
                                  right.dueDate?.getTime() ??
                                  Number.MAX_SAFE_INTEGER;
                                return (
                                  leftTime - rightTime ||
                                  left.name.localeCompare(right.name)
                                );
                              })
                              .map((item) => (
                                <tr key={item.id} className="text-sm">
                                  <td className="px-4 py-2.5">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-semibold text-muted-foreground">
                                        {item.code}
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {item.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-muted-foreground">
                                    {formatDate(item.startDate)}
                                  </td>
                                  <td className="px-4 py-2.5 text-muted-foreground">
                                    {formatDate(item.dueDate)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No milestone-specific Work Items.
                    </p>
                  )}

                  {milestone.workItems.length ? (
                    <ul className="space-y-2">
                      {milestone.workItems.map((item) => {
                        const canUpdate =
                          canManageWorkItems ||
                          (canUpdateAssignedWork &&
                            item.owner?.id === currentUserId);
                        return (
                          <li
                            key={item.id}
                            className="rounded-lg border bg-background px-3 py-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {item.code}
                                  </span>
                                  <ProjectStatusBadge
                                    status={item.status}
                                    label={displayEnum(item.status)}
                                  />
                                  <RiskBadge
                                    level={
                                      item.riskLevel.toLowerCase() as Lowercase<
                                        typeof item.riskLevel
                                      >
                                    }
                                  />
                                </div>
                                <p className="mt-2 font-semibold">{item.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {displayEnum(item.deliveryStage)}
                                  {" / "}
                                  Primary: {item.primaryWorkstream.name}
                                  {" / "}
                                  Owner: {item.owner?.displayName ?? "Unassigned"}
                                </p>
                                {item.blocker ? (
                                  <p className="mt-2 text-xs text-destructive">
                                    Blocker: {item.blocker}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <div className="text-right text-xs">
                                  <p className="font-semibold">{item.progress}%</p>
                                  <p className="text-muted-foreground">
                                    Due{" "}
                                    {item.dueDate?.toISOString().slice(0, 10) ??
                                      "not set"}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Next: {item.nextGate || "Not set"}
                                  </p>
                                </div>
                                {canUpdate ? (
                                  <Button asChild size="sm" variant="outline">
                                    <Link
                                      href={`/projects/${projectId}/milestones/${milestone.id}/work-items/${item.id}/edit`}
                                    >
                                      <Pencil />
                                      Update
                                    </Link>
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Boxes className="size-4 text-muted-foreground" />
                        Shared Dependencies
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Compact references to canonical project capabilities.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${projectId}/capabilities`}>
                        View canonical list
                      </Link>
                    </Button>
                  </div>
                  {!milestone.sharedCapabilityLinks.length ? (
                    <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                      No Shared Capability dependencies.
                    </p>
                  ) : (
                    <ul className="grid gap-2 lg:grid-cols-2">
                      {milestone.sharedCapabilityLinks.map((link) => {
                        const capability = link.sharedCapability;
                        const canUpdate =
                          canManageCapabilities ||
                          (canUpdateAssignedCapabilities &&
                            capability.owner?.id === currentUserId);
                        return (
                          <li
                            key={capability.id}
                            className="rounded-lg border bg-background px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {capability.code}
                                  </span>
                                  {link.isCritical ? (
                                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                      Critical dependency
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-sm font-semibold">
                                  {capability.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {displayEnum(capability.deliveryStage)}
                                  {" / "}
                                  {capability.progress}%
                                  {" / "}
                                  Primary: {capability.primaryWorkstream.name}
                                </p>
                                {link.sourceReference ? (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Source: {link.sourceReference}
                                  </p>
                                ) : null}
                                {link.dependencyNotes ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Dependency: {link.dependencyNotes}
                                  </p>
                                ) : null}
                              </div>
                              {canUpdate ? (
                                <Button asChild size="icon-sm" variant="outline">
                                  <Link
                                    aria-label={`Edit ${capability.name}`}
                                    href={`/projects/${projectId}/capabilities/${capability.id}/edit`}
                                  >
                                    <Pencil />
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
