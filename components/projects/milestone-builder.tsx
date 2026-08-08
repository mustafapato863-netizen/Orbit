"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { createMilestonePlanAction } from "@/app/(workspace)/projects/actions";
import {
  FormField,
  Input,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createMilestonePlanSchema,
  type CreateMilestonePlanInput,
} from "@/lib/projects/project.schemas";
import {
  calculateDurationDays,
  calculateEndDateFromDuration,
} from "@/lib/projects/project.utils";

const emptySubMilestone = {
  name: "",
  startDate: "",
  dueDate: "",
};

export function MilestoneBuilder({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMilestonePlanInput>({
    resolver: zodResolver(createMilestonePlanSchema),
    defaultValues: {
      projectId,
      name: "",
      subMilestones: [emptySubMilestone],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subMilestones",
  });

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createMilestonePlanAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The milestone plan could not be saved.");
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
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--orbit-border)] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orbit-purple)]">
          Main milestone
        </p>
        <FormField
          id="milestone-name"
          label="Milestone name"
          error={errors.name?.message}
          className="mt-3"
        >
          <Input
            id="milestone-name"
            autoFocus
            placeholder="Example: Foundation and planning"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--orbit-border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--orbit-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--orbit-text)]">
              Sub-milestones
            </h2>
            <p className="mt-1 text-xs text-[var(--orbit-text-muted)]">
              Add the work steps in delivery order. The milestone dates are
              calculated automatically from these rows.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...emptySubMilestone })}
          >
            <Plus />
            Add sub-milestone
          </Button>
        </div>

        <div className="divide-y divide-[var(--orbit-border)]">
          {fields.map((field, index) => {
            const rowErrors = errors.subMilestones?.[index];
            return (
              <div
                key={field.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[32px_minmax(240px,1fr)_180px_180px_36px] lg:items-start"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--orbit-surface-muted)] text-xs font-bold text-[var(--orbit-text-muted)]">
                  {index + 1}
                </span>
                <FormField
                  id={`sub-name-${index}`}
                  label="Sub-milestone"
                  error={rowErrors?.name?.message}
                >
                  <Input
                    id={`sub-name-${index}`}
                    placeholder="What needs to be completed?"
                    aria-invalid={Boolean(rowErrors?.name)}
                    {...register(`subMilestones.${index}.name`)}
                  />
                </FormField>
                <FormField
                  id={`sub-start-${index}`}
                  label="Start"
                  error={rowErrors?.startDate?.message}
                >
                  <Input
                    id={`sub-start-${index}`}
                    type="date"
                    aria-invalid={Boolean(rowErrors?.startDate)}
                    {...register(`subMilestones.${index}.startDate`, {
                      onChange: (e) => {
                        const start = e.target.value;
                        const due = watch(`subMilestones.${index}.dueDate`);
                        const duration = (e.target as any)._duration;
                        if (typeof duration === "number" && duration >= 0) {
                          const newDue = calculateEndDateFromDuration(start, duration);
                          if (newDue) setValue(`subMilestones.${index}.dueDate`, newDue, { shouldValidate: true });
                        }
                      },
                    })}
                  />
                </FormField>
                <FormField
                  id={`sub-duration-${index}`}
                  label="Days"
                >
                  <Input
                    id={`sub-duration-${index}`}
                    type="number"
                    min={0}
                    placeholder="Days"
                    value={calculateDurationDays(
                      watch(`subMilestones.${index}.startDate`) || "",
                      watch(`subMilestones.${index}.dueDate`) || ""
                    )}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val, 10);
                      const start = watch(`subMilestones.${index}.startDate`);
                      if (!Number.isNaN(parsed) && parsed >= 0 && start) {
                        const newDue = calculateEndDateFromDuration(start, parsed);
                        if (newDue) setValue(`subMilestones.${index}.dueDate`, newDue, { shouldValidate: true });
                      }
                    }}
                  />
                </FormField>
                <FormField
                  id={`sub-due-${index}`}
                  label="Due"
                  error={rowErrors?.dueDate?.message}
                >
                  <Input
                    id={`sub-due-${index}`}
                    type="date"
                    aria-invalid={Boolean(rowErrors?.dueDate)}
                    {...register(`subMilestones.${index}.dueDate`)}
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove sub-milestone ${index + 1}`}
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="mt-6 text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)]/45 px-5 py-3 text-xs text-[var(--orbit-text-muted)]">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Status starts as Not Started. Progress and advanced details can be
          updated later.
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild type="button" variant="outline">
          <Link href={`/projects/${projectId}/milestones`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isPending ? "Creating…" : "Create milestone plan"}
        </Button>
      </div>
    </form>
  );
}
