"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  archiveCapabilityAction,
  archiveWorkItemAction,
  updateCapabilityAction,
  updateWorkItemAction,
} from "@/app/(workspace)/projects/execution-actions";
import {
  pipelineStagePresentation,
  progressBarClassForStatus,
  workstreamPresentation,
} from "@/components/pipeline/pipeline-presentation";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { workItemStatuses } from "@/lib/execution/execution.schemas";
import {
  buildOverviewJourney,
  type DeliveryPipelineView,
} from "@/lib/pipeline/pipeline";
import {
  calculateDurationDays,
  calculateEndDateFromDuration,
} from "@/lib/projects/project.utils";
import { cn } from "@/lib/utils";

type PipelineRoadmapItem =
  DeliveryPipelineView["roadmapGroups"][number]["items"][number];

export type RoadmapEditPermissions = {
  userId: string;
  canManageMilestones: boolean;
  canManageWorkItems: boolean;
  canUpdateAssignedWorkItems: boolean;
  canManageCapabilities: boolean;
  canUpdateAssignedCapabilities: boolean;
};

export function canEditRoadmapItem(
  item: PipelineRoadmapItem,
  permissions: RoadmapEditPermissions,
) {
  if (item.itemKind === "specific") {
    return (
      permissions.canManageWorkItems ||
      (permissions.canUpdateAssignedWorkItems &&
        item.owner?.id === permissions.userId)
    );
  }

  return (
    permissions.canManageCapabilities ||
    (permissions.canUpdateAssignedCapabilities &&
      item.owner?.id === permissions.userId)
  );
}

function shortDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function fullDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function timelinePercent(value: Date, start: Date, end: Date) {
  const duration = Math.max(1, end.getTime() - start.getTime());
  return Math.max(
    0,
    Math.min(100, ((value.getTime() - start.getTime()) / duration) * 100),
  );
}

function isCurrentMonth(monthIso: string, asOfDate: Date) {
  const month = new Date(monthIso);
  return (
    month.getUTCFullYear() === asOfDate.getUTCFullYear() &&
    month.getUTCMonth() === asOfDate.getUTCMonth()
  );
}

function statusTone(status: string): Status {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
      return "in-progress";
    case "AT_RISK":
      return "at-risk";
    case "BLOCKED":
      return "blocked";
    default:
      return "not-started";
  }
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function progressForStatus(status: string, progress: number) {
  switch (status) {
    case "COMPLETED":
      return 100;
    case "NOT_STARTED":
    case "CANCELLED":
      return 0;
    default:
      return progress;
  }
}

function dateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function capabilityMilestoneLinks(
  pipeline: DeliveryPipelineView,
  sharedCapabilityId: string,
) {
  return pipeline.milestones.flatMap((milestone) =>
    milestone.sharedCapabilityLinks
      .filter(
        ({ sharedCapability }) => sharedCapability.id === sharedCapabilityId,
      )
      .map(({ sourceReference, dependencyNotes, isCritical }) => ({
        milestoneId: milestone.id,
        sourceReference: sourceReference ?? "",
        dependencyNotes: dependencyNotes ?? "",
        isCritical,
      })),
  );
}

export function TimelineLane({
  item,
  pipeline,
  compact = false,
  colorByWorkstream = false,
}: {
  item: PipelineRoadmapItem;
  pipeline: DeliveryPipelineView;
  compact?: boolean;
  colorByWorkstream?: boolean;
}) {
  const { start, end, months } = pipeline.timeline;
  const today = timelinePercent(pipeline.asOfDate, start, end);
  const journey = buildOverviewJourney(item);
  const presentation = pipelineStagePresentation[journey.currentStage];
  const markers = journey.markers.filter(
    (marker) => marker.date >= start && marker.date <= end,
  );
  const itemStart = item.startDate
    ? timelinePercent(item.startDate, start, end)
    : null;
  const itemEnd = item.dueDate
    ? timelinePercent(item.dueDate, start, end)
    : null;

  return (
    <div
      role="img"
      className={cn(
        "relative overflow-visible",
        compact ? "h-[48px]" : "h-[72px]",
      )}
      aria-label={`${item.name}: ${presentation.displayLabel}; ${markers.map((marker) => `${marker.code} ${fullDate(marker.date)}`).join(", ") || "no checkpoints scheduled"}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, months.length)}, minmax(0, 1fr))`,
        }}
      >
        {months.map((month) => {
          const current = isCurrentMonth(month.iso, pipeline.asOfDate);
          return (
            <span
              key={month.iso}
              className={cn(
                "border-r border-[var(--orbit-border-soft)] last:border-r-0 transition-colors",
                current && "bg-[#e8890c]/[0.03]",
              )}
            />
          );
        })}
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 z-10 w-0.5 bg-[#e8890c]/70 border-r border-[#e8890c]/40"
        style={{ left: `${today}%` }}
      />

      {itemStart !== null && itemEnd !== null ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute z-20 rounded-full shadow-xs ring-1 ring-black/5",
            compact ? "top-[22px] h-1.5" : "top-[31px] h-2",
            colorByWorkstream
              ? workstreamPresentation(item.primaryWorkstream.code).bar
              : presentation.bar,
          )}
          style={{
            left: `${itemStart}%`,
            width: `${Math.max(1.3, itemEnd - itemStart)}%`,
          }}
        />
      ) : null}

      {!compact
        ? markers.map((marker, index) => {
            const left = timelinePercent(marker.date, start, end);
            const markerPresentation =
              pipelineStagePresentation[marker.stage];
            return (
              <span
                key={`${marker.code}-${marker.date.toISOString()}-${index}`}
                className="absolute inset-y-0 z-30 w-0"
                style={{ left: `${left}%` }}
                title={`${marker.code} · ${fullDate(marker.date)} · ${marker.actual ? "Actual" : "Planned"}`}
              >
                <span
                  className={cn(
                    "absolute top-[17px] -translate-x-1/2 rounded-full px-2 py-0.5 text-[0.52rem] font-black leading-3 tracking-wide shadow-md ring-2 ring-white/90 border border-white/40 transition-transform hover:scale-110 cursor-pointer",
                    markerPresentation.bar,
                    markerPresentation.contrastText,
                  )}
                >
                  {marker.code}
                </span>
                <span className="absolute top-[43px] -translate-x-1/2 whitespace-nowrap rounded bg-white/80 px-1 text-[0.55rem] font-bold text-[var(--orbit-text-muted)] backdrop-blur-xs">
                  {shortDate(marker.date)}
                </span>
              </span>
            );
          })
        : null}
    </div>
  );
}

export function RoadmapItemEditor({
  item,
  pipeline,
  milestoneId,
  projectId,
  canEdit = true,
}: {
  item: PipelineRoadmapItem;
  pipeline: DeliveryPipelineView;
  milestoneId: string;
  projectId: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftMilestoneId, setDraftMilestoneId] = useState(milestoneId);
  const [draftName, setDraftName] = useState(item.name);
  const [draftStatus, setDraftStatus] = useState<string>(item.status);
  const [draftProgress, setDraftProgress] = useState(
    String(progressForStatus(item.status, item.progress)),
  );
  const [draftStartDate, setDraftStartDate] = useState(dateInputValue(item.startDate));
  const [draftDueDate, setDraftDueDate] = useState(dateInputValue(item.dueDate));
  const [draftDurationDays, setDraftDurationDays] = useState<number | "">(() =>
    calculateDurationDays(dateInputValue(item.startDate), dateInputValue(item.dueDate)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStartDateChange = (newStart: string) => {
    setDraftStartDate(newStart);
    if (typeof draftDurationDays === "number" && draftDurationDays >= 0) {
      const newDue = calculateEndDateFromDuration(newStart, draftDurationDays);
      if (newDue) setDraftDueDate(newDue);
    } else if (draftDueDate) {
      setDraftDurationDays(calculateDurationDays(newStart, draftDueDate));
    }
  };

  const handleDueDateChange = (newDue: string) => {
    setDraftDueDate(newDue);
    setDraftDurationDays(calculateDurationDays(draftStartDate, newDue));
  };

  const handleDurationChange = (val: string) => {
    if (val === "") {
      setDraftDurationDays("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setDraftDurationDays(parsed);
      if (draftStartDate) {
        const newDue = calculateEndDateFromDuration(draftStartDate, parsed);
        if (newDue) setDraftDueDate(newDue);
      }
    }
  };

  const progress =
    draftStatus === "IN_PROGRESS"
      ? Number(draftProgress || progressForStatus(item.status, item.progress))
      : progressForStatus(draftStatus, item.progress);
  const baseTitle =
    item.itemKind === "shared" ? `Shared: ${item.name}` : item.name;

  async function handleSave() {
    const payload = {
      projectId,
      code: item.code,
      name: draftName.trim(),
      description: item.description ?? "",
      primaryWorkstreamId: item.primaryWorkstream.id,
      supportingWorkstreamIds: item.supportingWorkstreams.map(
        ({ workstream }) => workstream.id,
      ),
      status: draftStatus as (typeof workItemStatuses)[number],
      progress,
      deliveryStage: item.deliveryStage,
      nextGate: item.nextGate ?? "",
      startDate: draftStartDate,
      dueDate: draftDueDate,
      ownerId: item.owner?.id ?? "",
      riskLevel: item.riskLevel,
      blocker: item.blocker ?? "",
      notes: item.notes ?? "",
      acceptanceCriteria: item.acceptanceCriteria ?? "",
    };

    startTransition(async () => {
      const result =
        item.itemKind === "specific"
          ? await updateWorkItemAction({
              ...payload,
              milestoneId: draftMilestoneId,
              workItemId: item.id,
            })
          : await updateCapabilityAction({
              ...payload,
              sharedCapabilityId: item.id,
              milestoneLinks: capabilityMilestoneLinks(pipeline, item.id),
            });

      if (!result.success) {
        const errorDetail = result.fieldErrors
          ? Object.entries(result.fieldErrors)
              .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : String(errs)}`)
              .join(" | ")
          : null;
        setMessage(errorDetail || result.message || "The item could not be updated.");
        return;
      }

      setIsEditing(false);
      setMessage(null);
      router.refresh();
    });
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    startTransition(async () => {
      const result =
        item.itemKind === "specific"
          ? await archiveWorkItemAction({
              projectId,
              milestoneId,
              workItemId: item.id,
            })
          : await archiveCapabilityAction({
              projectId,
              sharedCapabilityId: item.id,
            });

      setIsDeleting(false);
      setShowDeleteModal(false);

      if (!result.success) {
        setMessage(result.message || "The item could not be deleted.");
        return;
      }

      setIsEditing(false);
      setMessage(null);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <>
        <form
          className="space-y-2 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Task Name</label>
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.72rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              aria-label="Work package name"
            />
          </div>
          <div>
            <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Status</label>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
              className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.68rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              aria-label="Work package status"
            >
              {workItemStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {draftStatus === "IN_PROGRESS" ? (
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">
                Progress (%)
              </label>
              <input
                type="number"
                inputMode="numeric"
                step={1}
                value={draftProgress}
                onChange={(event) => setDraftProgress(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.72rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
                aria-label="Work package progress"
              />
              <p className="mt-1 text-[0.56rem] text-[var(--orbit-text-muted)]">
                Enter a whole percentage above 10.
              </p>
            </div>
          ) : null}

          {item.itemKind === "specific" && pipeline.milestones.length > 1 ? (
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">
                Assigned Milestone
              </label>
              <select
                value={draftMilestoneId}
                onChange={(event) => setDraftMilestoneId(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.68rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
                aria-label="Assigned milestone"
              >
                {pipeline.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Start Date</label>
              <input
                type="date"
                value={draftStartDate}
                onChange={(event) => handleStartDateChange(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-1 text-[0.63rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              />
            </div>
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Days</label>
              <input
                type="number"
                min={0}
                placeholder="Days"
                value={draftDurationDays}
                onChange={(event) => handleDurationChange(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-1 text-[0.63rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              />
            </div>
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Due Date</label>
              <input
                type="date"
                value={draftDueDate}
                onChange={(event) => handleDueDateChange(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-1 text-[0.63rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                className="h-7 bg-[var(--orbit-purple)] px-3 text-[0.65rem] text-white hover:bg-[#5b48c5]"
                disabled={isPending || !draftName.trim()}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[0.65rem]"
                disabled={isPending}
                onClick={() => {
                  setIsEditing(false);
                  setDraftName(item.name);
                  setDraftStatus(item.status);
                  setDraftProgress(String(progressForStatus(item.status, item.progress)));
                  setDraftStartDate(dateInputValue(item.startDate));
                  setDraftDueDate(dateInputValue(item.dueDate));
                  setMessage(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[0.65rem] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isPending}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
          {message ? (
            <p role="alert" className="mt-1 text-[0.65rem] font-semibold text-destructive">
              {message}
            </p>
          ) : null}
        </form>

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          itemName={item.name}
          isDeleting={isDeleting}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setShowDeleteModal(false)}
        />
      </>
    );
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={!canEdit}
        className="block w-full text-left text-[0.73rem] font-semibold leading-4 text-[var(--orbit-text)] outline-none transition hover:text-[#6350c9] hover:underline focus-visible:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-[var(--orbit-text)] disabled:hover:no-underline"
        onClick={() => {
          setIsEditing(true);
          setMessage(null);
        }}
        title={
          canEdit
            ? `Edit ${baseTitle}`
            : "You do not have permission to edit this item"
        }
      >
        <span className="line-clamp-2">{baseTitle}</span>
      </button>
      <div className="mt-2 flex items-center gap-2">
        <StatusBadge
          status={statusTone(item.status)}
          label={statusLabel(item.status)}
          className="px-1.5 py-0.5 text-[0.54rem]"
        />
        <span className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">
          {progress}%
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eef0f4]">
        <div
          className={cn(
            "h-full rounded-full",
            progressBarClassForStatus(item.status),
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function GroupRoadmapSummary({
  group,
  pipeline,
  colorByWorkstream = false,
}: {
  group: DeliveryPipelineView["roadmapGroups"][number];
  pipeline: DeliveryPipelineView;
  colorByWorkstream?: boolean;
}) {
  const { start, end } = pipeline.timeline;
  return (
    <div className="relative h-[72px] overflow-visible">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, pipeline.timeline.months.length)}, minmax(0, 1fr))`,
        }}
      >
        {pipeline.timeline.months.map((month) => {
          const current = isCurrentMonth(month.iso, pipeline.asOfDate);
          return (
            <span
              key={month.iso}
              className={cn(
                "border-r border-[var(--orbit-border-soft)] last:border-r-0",
                current && "bg-[#fdf1dd]/55",
              )}
            />
          );
        })}
      </div>

      {group.items.map((item) => {
        if (!item.startDate || !item.dueDate) return null;
        const left = timelinePercent(item.startDate, start, end);
        const width = Math.max(
          1.5,
          timelinePercent(item.dueDate, start, end) - left,
        );
        return (
          <span
            key={item.id}
            aria-hidden="true"
            className={cn(
              "absolute z-20 top-1/2 h-6 -translate-y-1/2 rounded-full shadow-sm ring-1 ring-white/70",
              colorByWorkstream
                ? workstreamPresentation(item.primaryWorkstream.code).bar
                : progressBarClassForStatus(item.status),
            )}
            style={{
              left: `${left}%`,
              width: `${width}%`,
            }}
          />
        );
      })}
    </div>
  );
}
