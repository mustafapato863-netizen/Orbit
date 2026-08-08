"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  createWorkItemAction,
  updateWorkItemAction,
} from "@/app/(workspace)/projects/execution-actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createWorkItemSchema,
  deliveryStages,
  executionRiskLevels,
  workItemStatuses,
  type CreateWorkItemInput,
} from "@/lib/execution/execution.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

type WorkstreamOption = {
  id: string;
  code: string;
  name: string;
  colorToken: string;
};
type MemberOption = {
  user: { id: string; displayName: string; email: string };
};

export function WorkItemForm({
  projectId,
  milestoneId,
  workItemId,
  workstreams,
  members,
  initialValues,
}: {
  projectId: string;
  milestoneId: string;
  workItemId?: string;
  workstreams: WorkstreamOption[];
  members: MemberOption[];
  initialValues?: CreateWorkItemInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateWorkItemInput>({
    resolver: zodResolver(createWorkItemSchema),
    defaultValues: initialValues ?? {
      projectId,
      milestoneId,
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
    },
  });

  const [durationDays, setDurationDays] = useState<string>(() => {
    if (initialValues?.startDate && initialValues?.dueDate) {
      const d1 = new Date(initialValues.startDate);
      const d2 = new Date(initialValues.dueDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? String(diffDays) : "";
    }
    return "";
  });

  const primaryWorkstreamId = useWatch({
    control,
    name: "primaryWorkstreamId",
  });
  const status = useWatch({
    control,
    name: "status",
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value;
    setValue("startDate", start);
    if (start && durationDays) {
      const days = parseInt(durationDays, 10);
      if (!isNaN(days) && days >= 0) {
        const d = new Date(start);
        d.setDate(d.getDate() + days);
        setValue("dueDate", d.toISOString().split("T")[0]);
      }
    } else if (start && getValues("dueDate")) {
      const d1 = new Date(start);
      const d2 = new Date(getValues("dueDate"));
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) setDurationDays(String(diffDays));
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const daysStr = e.target.value;
    setDurationDays(daysStr);
    const start = getValues("startDate");
    if (start && daysStr) {
      const days = parseInt(daysStr, 10);
      if (!isNaN(days) && days >= 0) {
        const d = new Date(start);
        d.setDate(d.getDate() + days);
        setValue("dueDate", d.toISOString().split("T")[0]);
      }
    }
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const due = e.target.value;
    setValue("dueDate", due);
    const start = getValues("startDate");
    if (start && due) {
      const d1 = new Date(start);
      const d2 = new Date(due);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) setDurationDays(String(diffDays));
    }
  };

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = workItemId
        ? await updateWorkItemAction({ ...values, workItemId })
        : await createWorkItemAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The Work Item could not be saved.");
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
      router.refresh();
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <input type="hidden" {...register("projectId")} />
      <input type="hidden" {...register("milestoneId")} />
      {message ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <FormField id="work-name" label="Name" error={errors.name?.message}>
        <Input id="work-name" {...register("name")} />
      </FormField>
      <FormField
        id="work-description"
        label="Description"
        error={errors.description?.message}
      >
        <Textarea id="work-description" {...register("description")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="work-primary"
          label="Primary Workstream"
          error={errors.primaryWorkstreamId?.message}
        >
          <select
            id="work-primary"
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
        <FormField id="work-status" label="Status" error={errors.status?.message}>
          <select
            id="work-status"
            className={selectClasses}
            {...register("status")}
          >
            {workItemStatuses.map((status) => (
              <option key={status} value={status}>
                {displayEnum(status)}
              </option>
            ))}
          </select>
        </FormField>
        {status === "IN_PROGRESS" ? (
          <FormField
            id="work-progress"
            label="Progress (%)"
            error={errors.progress?.message}
          >
            <Input
              id="work-progress"
              type="number"
              inputMode="numeric"
              step={1}
              {...register("progress", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter any whole percentage above 10.
            </p>
          </FormField>
        ) : (
          <div className="flex items-end rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Progress is managed automatically until the status is In Progress.
          </div>
        )}
        <FormField
          id="work-stage"
          label="Delivery Stage"
          error={errors.deliveryStage?.message}
        >
          <select
            id="work-stage"
            className={selectClasses}
            {...register("deliveryStage")}
          >
            {deliveryStages.map((stage) => (
              <option key={stage} value={stage}>
                {displayEnum(stage)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="work-risk"
          label="Risk"
          error={errors.riskLevel?.message}
        >
          <select
            id="work-risk"
            className={selectClasses}
            {...register("riskLevel")}
          >
            {executionRiskLevels.map((risk) => (
              <option key={risk} value={risk}>
                {displayEnum(risk)}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <FormField
          id="work-owner"
          label="Owner"
          error={errors.ownerId?.message}
        >
          <select
            id="work-owner"
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
          id="work-next-gate"
          label="Next Gate"
          error={errors.nextGate?.message}
        >
          <Input id="work-next-gate" {...register("nextGate")} />
        </FormField>
        <FormField
          id="work-start"
          label="Start date"
          error={errors.startDate?.message}
        >
          <Input
            id="work-start"
            type="date"
            {...register("startDate")}
            onChange={handleStartDateChange}
          />
        </FormField>
        <FormField id="work-duration" label="Duration (Days)">
          <Input
            id="work-duration"
            type="number"
            min={0}
            placeholder="e.g. 7"
            value={durationDays}
            onChange={handleDurationChange}
          />
        </FormField>
        <FormField
          id="work-due"
          label="Due date"
          error={errors.dueDate?.message}
        >
          <Input
            id="work-due"
            type="date"
            {...register("dueDate")}
            onChange={handleDueDateChange}
          />
        </FormField>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <FormField
          id="work-blocker"
          label="Blockers"
          error={errors.blocker?.message}
        >
          <Textarea id="work-blocker" {...register("blocker")} />
        </FormField>
        <FormField id="work-notes" label="Notes" error={errors.notes?.message}>
          <Textarea id="work-notes" {...register("notes")} />
        </FormField>
        <FormField
          id="work-acceptance"
          label="Acceptance criteria"
          error={errors.acceptanceCriteria?.message}
        >
          <Textarea id="work-acceptance" {...register("acceptanceCriteria")} />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button disabled={isPending || workstreams.length === 0}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isPending
            ? "Saving…"
            : workItemId
              ? "Save Work Item"
              : "Create Work Item"}
        </Button>
      </div>
    </form>
  );
}
