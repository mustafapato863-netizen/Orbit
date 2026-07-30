"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  updateAssignedCapabilityAction,
  updateAssignedWorkItemAction,
} from "@/app/(workspace)/projects/execution-actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  assignedExecutionSchema,
  deliveryStages,
  executionRiskLevels,
  workItemStatuses,
  type AssignedExecutionInput,
} from "@/lib/execution/execution.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

type AssignedValues = Omit<AssignedExecutionInput, "workItemId">;

export function AssignedExecutionForm({
  entityId,
  kind,
  initialValues,
}: {
  entityId: string;
  kind: "work-item" | "capability";
  initialValues: AssignedValues;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignedExecutionInput>({
    resolver: zodResolver(assignedExecutionSchema),
    defaultValues: { workItemId: entityId, ...initialValues },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result =
            kind === "work-item"
              ? await updateAssignedWorkItemAction(values)
              : await updateAssignedCapabilityAction({
                  sharedCapabilityId: entityId,
                  status: values.status,
                  progress: values.progress,
                  deliveryStage: values.deliveryStage,
                  nextGate: values.nextGate,
                  riskLevel: values.riskLevel,
                  blocker: values.blocker,
                  notes: values.notes,
                });
          setMessage({
            success: result.success,
            text:
              result.message ??
              (result.success
                ? "Execution status updated."
                : "Execution status could not be updated."),
          });
        }),
      )}
    >
      <input type="hidden" {...register("workItemId")} />
      {message ? (
        <p
          role={message.success ? "status" : "alert"}
          className={
            message.success
              ? "text-sm text-emerald-700 dark:text-emerald-300"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="assigned-status" label="Status" error={errors.status?.message}>
          <select
            id="assigned-status"
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
          id="assigned-progress"
          label="Progress (%)"
          error={errors.progress?.message}
        >
          <Input
            id="assigned-progress"
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
          id="assigned-stage"
          label="Delivery Stage"
          error={errors.deliveryStage?.message}
        >
          <select
            id="assigned-stage"
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
          id="assigned-risk"
          label="Risk"
          error={errors.riskLevel?.message}
        >
          <select
            id="assigned-risk"
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
      <FormField
        id="assigned-next-gate"
        label="Next Gate"
        error={errors.nextGate?.message}
      >
        <Input id="assigned-next-gate" {...register("nextGate")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="assigned-blocker"
          label="Blockers"
          error={errors.blocker?.message}
        >
          <Textarea id="assigned-blocker" {...register("blocker")} />
        </FormField>
        <FormField
          id="assigned-notes"
          label="Notes"
          error={errors.notes?.message}
        >
          <Textarea id="assigned-notes" {...register("notes")} />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isPending ? "Saving…" : "Update execution"}
        </Button>
      </div>
    </form>
  );
}
