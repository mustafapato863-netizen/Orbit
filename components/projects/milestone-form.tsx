"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createMilestoneAction,
  updateMilestoneAction,
} from "@/app/(workspace)/projects/actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createMilestoneSchema,
  milestoneStatuses,
  releaseHorizons,
  riskLevels,
  type CreateMilestoneInput,
} from "@/lib/projects/project.schemas";
import {
  calculateDurationDays,
  calculateEndDateFromDuration,
  displayEnum,
} from "@/lib/projects/project.utils";

export function MilestoneForm({
  projectId,
  milestoneId,
  initialValues,
}: {
  projectId: string;
  milestoneId?: string;
  initialValues?: CreateMilestoneInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: initialValues ?? {
      projectId,
      name: "",
      businessPurpose: "",
      status: "NOT_STARTED",
      progress: 0,
      riskLevel: "LOW",
      releaseHorizon: "RELEASE_1",
      startDate: "",
      dueDate: "",
      deliveredScope: "",
      remainingScope: "",
      currentBlockers: "",
      nextAction: "",
      firstReleaseImpact: "",
    },
  });

  const startDateValue = watch("startDate");
  const dueDateValue = watch("dueDate");
  const [durationDays, setDurationDays] = useState<number | "">(() =>
    calculateDurationDays(startDateValue || "", dueDateValue || ""),
  );

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setValue("startDate", newStart, { shouldValidate: true });
    if (typeof durationDays === "number" && durationDays >= 0) {
      const newDue = calculateEndDateFromDuration(newStart, durationDays);
      if (newDue) setValue("dueDate", newDue, { shouldValidate: true });
    } else if (dueDateValue) {
      setDurationDays(calculateDurationDays(newStart, dueDateValue));
    }
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDue = e.target.value;
    setValue("dueDate", newDue, { shouldValidate: true });
    setDurationDays(calculateDurationDays(startDateValue, newDue));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setDurationDays("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setDurationDays(parsed);
      if (startDateValue) {
        const newDue = calculateEndDateFromDuration(startDateValue, parsed);
        if (newDue) setValue("dueDate", newDue, { shouldValidate: true });
      }
    }
  };

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = milestoneId
        ? await updateMilestoneAction({ ...values, milestoneId })
        : await createMilestoneAction(values);

      if (!result.success) {
        setMessage(result.message ?? "The milestone could not be saved.");
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
      router.refresh();
    });
  });

  const textAreas = [
    ["businessPurpose", "Business purpose"],
    ["deliveredScope", "Delivered scope"],
    ["remainingScope", "Remaining scope"],
    ["currentBlockers", "Current blockers"],
    ["nextAction", "Next action"],
    ["firstReleaseImpact", "First-release impact"],
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {message ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}
      <input type="hidden" {...register("projectId")} />
      <FormField
        id="milestone-name"
        label="Milestone name"
        error={errors.name?.message}
      >
        <Input
          id="milestone-name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          id="milestone-status"
          label="Status"
          error={errors.status?.message}
        >
          <select
            id="milestone-status"
            className={selectClasses}
            {...register("status")}
          >
            {milestoneStatuses.map((status) => (
              <option key={status} value={status}>
                {displayEnum(status)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="milestone-progress"
          label="Progress (%)"
          error={errors.progress?.message}
        >
          <Input
            id="milestone-progress"
            type="number"
            min={0}
            max={100}
            aria-invalid={Boolean(errors.progress)}
            {...register("progress", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          id="milestone-risk"
          label="Risk"
          error={errors.riskLevel?.message}
        >
          <select
            id="milestone-risk"
            className={selectClasses}
            {...register("riskLevel")}
          >
            {riskLevels.map((risk) => (
              <option key={risk} value={risk}>
                {displayEnum(risk)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="milestone-release"
          label="Release classification"
          error={errors.releaseHorizon?.message}
        >
          <select
            id="milestone-release"
            className={selectClasses}
            {...register("releaseHorizon")}
          >
            {releaseHorizons.map((release) => (
              <option key={release} value={release}>
                {release === "RELEASE_1" ? "Release 1" : "Phase 2"}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField
          id="milestone-start-date"
          label="Start date"
          error={errors.startDate?.message}
        >
          <Input
            id="milestone-start-date"
            type="date"
            aria-invalid={Boolean(errors.startDate)}
            {...register("startDate")}
            onChange={handleStartDateChange}
          />
        </FormField>
        <FormField
          id="milestone-duration"
          label="Duration (Days)"
        >
          <Input
            id="milestone-duration"
            type="number"
            min={0}
            placeholder="e.g. 14"
            value={durationDays}
            onChange={handleDurationChange}
          />
        </FormField>
        <FormField
          id="milestone-due-date"
          label="Due date"
          error={errors.dueDate?.message}
        >
          <Input
            id="milestone-due-date"
            type="date"
            aria-invalid={Boolean(errors.dueDate)}
            {...register("dueDate")}
            onChange={handleDueDateChange}
          />
        </FormField>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {textAreas.map(([name, label]) => (
          <FormField
            key={name}
            id={`milestone-${name}`}
            label={label}
            error={errors[name]?.message}
            className={name === "businessPurpose" ? "lg:col-span-2" : undefined}
          >
            <Textarea
              id={`milestone-${name}`}
              aria-invalid={Boolean(errors[name])}
              {...register(name)}
            />
          </FormField>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isPending
            ? "Saving…"
            : milestoneId
              ? "Save milestone"
              : "Create milestone"}
        </Button>
      </div>
    </form>
  );
}
