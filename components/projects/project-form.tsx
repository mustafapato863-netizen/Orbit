"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOff, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(workspace)/projects/actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createProjectSchema,
  projectStatuses,
  type CreateProjectInput,
} from "@/lib/projects/project.schemas";
import { displayEnum } from "@/lib/projects/project.utils";
import {
  projectTypes,
  workstreamTemplates,
} from "@/lib/workstreams/workstream-templates";

export function ProjectForm({
  projectId,
  initialValues,
  canManageVisibility = false,
}: {
  projectId?: string;
  initialValues?: CreateProjectInput;
  canManageVisibility?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: initialValues ?? {
      name: "",
      description: "",
      status: "PLANNING",
      progress: 0,
      isPrivate: false,
      projectType: "CUSTOM",
      setupTemplate: "CUSTOM",
      startDate: "",
      targetDate: "",
    },
  });

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = projectId
        ? await updateProjectAction({ ...values, projectId })
        : await createProjectAction(values);

      if (!result.success) {
        setMessage(result.message ?? "The project could not be saved.");
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
      router.refresh();
    });
  });

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
      <FormField
        id="project-name"
        label="Project name"
        error={errors.name?.message}
      >
        <Input
          id="project-name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormField>
      <FormField
        id="project-description"
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          id="project-description"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="project-type"
          label="Project type"
          error={errors.projectType?.message}
        >
          <select
            id="project-type"
            className={selectClasses}
            {...register("projectType")}
          >
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {workstreamTemplates[type].label}
              </option>
            ))}
          </select>
        </FormField>
        {!projectId ? (
          <FormField
            id="project-template"
            label="Starting structure"
            error={errors.setupTemplate?.message}
          >
            <select
              id="project-template"
              className={selectClasses}
              {...register("setupTemplate")}
            >
              {projectTypes.map((template) => (
                <option key={template} value={template}>
                  {workstreamTemplates[template].label}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          id="project-status"
          label="Status"
          error={errors.status?.message}
        >
          <select
            id="project-status"
            className={selectClasses}
            {...register("status")}
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {displayEnum(status)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="project-progress"
          label="Progress (%)"
          error={errors.progress?.message}
        >
          <Input
            id="project-progress"
            type="number"
            min={0}
            max={100}
            aria-invalid={Boolean(errors.progress)}
            {...register("progress", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          id="project-start-date"
          label="Start date"
          error={errors.startDate?.message}
        >
          <Input
            id="project-start-date"
            type="date"
            aria-invalid={Boolean(errors.startDate)}
            {...register("startDate")}
          />
        </FormField>
        <FormField
          id="project-target-date"
          label="Target date"
          error={errors.targetDate?.message}
        >
          <Input
            id="project-target-date"
            type="date"
            aria-invalid={Boolean(errors.targetDate)}
            {...register("targetDate")}
          />
        </FormField>
      </div>
      {canManageVisibility ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] p-4 transition-colors hover:border-[#d8d3ff]">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-[var(--orbit-border)] accent-[var(--orbit-purple)]"
            {...register("isPrivate")}
          />
          <span className="flex min-w-0 gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#efebff] text-[#6350c9]">
              <EyeOff className="size-4" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-sm text-[var(--orbit-text)]">
                Administrator-only project
              </strong>
              <span className="mt-1 block text-xs leading-5 text-[var(--orbit-text-muted)]">
                Hide this project from all non-administrator accounts, even if an old membership exists.
              </span>
            </span>
          </span>
        </label>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isPending ? "Saving…" : projectId ? "Save project" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
