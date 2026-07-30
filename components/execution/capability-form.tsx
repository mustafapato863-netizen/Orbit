"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import {
  createCapabilityAction,
  updateCapabilityAction,
} from "@/app/(workspace)/projects/execution-actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createSharedCapabilitySchema,
  deliveryStages,
  executionRiskLevels,
  workItemStatuses,
  type CreateSharedCapabilityInput,
} from "@/lib/execution/execution.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

type WorkstreamOption = { id: string; code: string; name: string };
type MemberOption = {
  user: { id: string; displayName: string; email: string };
};
type MilestoneOption = { id: string; code: string; name: string };

export function CapabilityForm({
  projectId,
  sharedCapabilityId,
  workstreams,
  members,
  milestones,
  initialValues,
}: {
  projectId: string;
  sharedCapabilityId?: string;
  workstreams: WorkstreamOption[];
  members: MemberOption[];
  milestones: MilestoneOption[];
  initialValues?: CreateSharedCapabilityInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<CreateSharedCapabilityInput>({
    resolver: zodResolver(createSharedCapabilitySchema),
    defaultValues: initialValues ?? {
      projectId,
      name: "",
      description: "",
      primaryWorkstreamId: workstreams[0]?.id ?? "",
      supportingWorkstreamIds: [],
      status: "NOT_STARTED",
      progress: 0,
      deliveryStage: "NOT_STARTED",
      nextGate: "",
      startDate: "",
      dueDate: "",
      ownerId: "",
      riskLevel: "LOW",
      blocker: "",
      notes: "",
      acceptanceCriteria: "",
      milestoneLinks: milestones[0]
        ? [
            {
              milestoneId: milestones[0].id,
              sourceReference: "",
              dependencyNotes: "",
              isCritical: false,
            },
          ]
        : [],
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  const links = useFieldArray({ control, name: "milestoneLinks" });
  const primaryWorkstreamId = useWatch({
    control,
    name: "primaryWorkstreamId",
  });

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = sharedCapabilityId
        ? await updateCapabilityAction({ ...values, sharedCapabilityId })
        : await createCapabilityAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The Shared Capability could not be saved.");
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
      router.refresh();
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <input type="hidden" {...register("projectId")} />
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <FormField
        id="capability-name"
        label="Canonical name"
        error={errors.name?.message}
      >
        <Input id="capability-name" {...register("name")} />
      </FormField>
      <FormField
        id="capability-description"
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          id="capability-description"
          {...register("description")}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="capability-primary"
          label="Primary Workstream"
          error={errors.primaryWorkstreamId?.message}
        >
          <select
            id="capability-primary"
            className={selectClasses}
            {...register("primaryWorkstreamId")}
          >
            {workstreams.map((workstream) => (
              <option key={workstream.id} value={workstream.id}>
                {workstream.name}
              </option>
            ))}
          </select>
        </FormField>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Supporting Workstreams</legend>
          <div className="flex min-h-9 flex-wrap gap-3 rounded-md border px-3 py-2">
            {workstreams.map((workstream) => (
              <label
                key={workstream.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  value={workstream.id}
                  disabled={workstream.id === primaryWorkstreamId}
                  {...register("supportingWorkstreamIds")}
                />
                {workstream.name}
              </label>
            ))}
          </div>
          {errors.supportingWorkstreamIds?.message ? (
            <p className="text-xs text-destructive">
              {errors.supportingWorkstreamIds.message}
            </p>
          ) : null}
        </fieldset>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          id="capability-status"
          label="Status"
          error={errors.status?.message}
        >
          <select
            id="capability-status"
            className={selectClasses}
            {...register("status")}
          >
            {workItemStatuses.map((value) => (
              <option key={value} value={value}>
                {displayEnum(value)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="capability-progress"
          label="Progress (%)"
          error={errors.progress?.message}
        >
          <Input
            id="capability-progress"
            type="number"
            inputMode="numeric"
            step={1}
            {...register("progress", { valueAsNumber: true })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter a whole percentage above 10 when the status is In Progress.
          </p>
        </FormField>
        <FormField
          id="capability-stage"
          label="Delivery Stage"
          error={errors.deliveryStage?.message}
        >
          <select
            id="capability-stage"
            className={selectClasses}
            {...register("deliveryStage")}
          >
            {deliveryStages.map((value) => (
              <option key={value} value={value}>
                {displayEnum(value)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="capability-risk"
          label="Risk"
          error={errors.riskLevel?.message}
        >
          <select
            id="capability-risk"
            className={selectClasses}
            {...register("riskLevel")}
          >
            {executionRiskLevels.map((value) => (
              <option key={value} value={value}>
                {displayEnum(value)}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          id="capability-owner"
          label="Owner"
          error={errors.ownerId?.message}
        >
          <select
            id="capability-owner"
            className={selectClasses}
            {...register("ownerId")}
          >
            <option value="">Unassigned</option>
            {members.map(({ user }) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="capability-next-gate"
          label="Next Gate"
          error={errors.nextGate?.message}
        >
          <Input id="capability-next-gate" {...register("nextGate")} />
        </FormField>
        <FormField
          id="capability-start"
          label="Start date"
          error={errors.startDate?.message}
        >
          <Input
            id="capability-start"
            type="date"
            {...register("startDate")}
          />
        </FormField>
        <FormField
          id="capability-due"
          label="Due date"
          error={errors.dueDate?.message}
        >
          <Input id="capability-due" type="date" {...register("dueDate")} />
        </FormField>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <FormField
          id="capability-blocker"
          label="Blockers"
          error={errors.blocker?.message}
        >
          <Textarea id="capability-blocker" {...register("blocker")} />
        </FormField>
        <FormField
          id="capability-notes"
          label="Notes"
          error={errors.notes?.message}
        >
          <Textarea id="capability-notes" {...register("notes")} />
        </FormField>
        <FormField
          id="capability-acceptance"
          label="Acceptance criteria"
          error={errors.acceptanceCriteria?.message}
        >
          <Textarea
            id="capability-acceptance"
            {...register("acceptanceCriteria")}
          />
        </FormField>
      </div>

      <section className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Milestone dependencies</h2>
            <p className="text-sm text-muted-foreground">
              Link this one canonical record to every affected milestone.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!milestones.length}
            onClick={() =>
              links.append({
                milestoneId: milestones[0]?.id ?? "",
                sourceReference: "",
                dependencyNotes: "",
                isCritical: false,
              })
            }
          >
            <Plus />
            Add link
          </Button>
        </div>
        {links.fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-4 rounded-lg border bg-muted/20 p-4 lg:grid-cols-[1fr_1fr_1.5fr_auto]"
          >
            <FormField
              id={`capability-link-milestone-${index}`}
              label="Business Milestone"
              error={errors.milestoneLinks?.[index]?.milestoneId?.message}
            >
              <select
                id={`capability-link-milestone-${index}`}
                className={selectClasses}
                {...register(`milestoneLinks.${index}.milestoneId`)}
              >
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.code} — {milestone.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              id={`capability-link-source-${index}`}
              label="Source reference"
              error={errors.milestoneLinks?.[index]?.sourceReference?.message}
            >
              <Input
                id={`capability-link-source-${index}`}
                placeholder="e.g. security baseline §4"
                {...register(`milestoneLinks.${index}.sourceReference`)}
              />
            </FormField>
            <FormField
              id={`capability-link-notes-${index}`}
              label="Dependency reference"
              error={errors.milestoneLinks?.[index]?.dependencyNotes?.message}
            >
              <Input
                id={`capability-link-notes-${index}`}
                placeholder="Why this milestone depends on the capability"
                {...register(`milestoneLinks.${index}.dependencyNotes`)}
              />
            </FormField>
            <div className="flex items-end gap-3 pb-0.5">
              <label className="flex h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register(`milestoneLinks.${index}.isCritical`)}
                />
                Critical
              </label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remove milestone link"
                disabled={links.fields.length === 1}
                onClick={() => links.remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {errors.milestoneLinks?.root?.message ? (
          <p className="text-xs text-destructive">
            {errors.milestoneLinks.root.message}
          </p>
        ) : null}
      </section>

      <div className="flex justify-end">
        <Button
          disabled={
            isPending || !workstreams.length || !milestones.length
          }
        >
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isPending
            ? "Saving…"
            : sharedCapabilityId
              ? "Save Shared Capability"
              : "Create Shared Capability"}
        </Button>
      </div>
    </form>
  );
}
