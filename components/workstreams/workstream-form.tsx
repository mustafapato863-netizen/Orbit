"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  archiveWorkstreamAction,
  createWorkstreamAction,
  updateWorkstreamAction,
} from "@/app/(workspace)/projects/workstream-actions";
import {
  FormField,
  Input,
  selectClasses,
  Textarea,
} from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createWorkstreamSchema,
  type CreateWorkstreamInput,
} from "@/lib/workstreams/workstream.schemas";

const iconOptions = [
  ["layers", "General"],
  ["target", "Strategy"],
  ["users", "People"],
  ["workflow", "Process"],
  ["settings", "Operations"],
  ["monitor", "Digital / Frontend"],
  ["server", "Services / Backend"],
  ["database", "Data"],
  ["shield-check", "Quality & Compliance"],
  ["hard-hat", "Construction"],
  ["megaphone", "Marketing"],
] as const;

export function WorkstreamForm({
  projectId,
  workstreamId,
  initialValues,
}: {
  projectId: string;
  workstreamId?: string;
  initialValues?: Omit<CreateWorkstreamInput, "projectId">;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkstreamInput>({
    resolver: zodResolver(createWorkstreamSchema),
    defaultValues: {
      projectId,
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      colorToken: initialValues?.colorToken ?? "#7157e8",
      iconKey: initialValues?.iconKey ?? "layers",
      sortOrder: initialValues?.sortOrder ?? 10,
    },
  });

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = workstreamId
        ? await updateWorkstreamAction({ ...values, workstreamId })
        : await createWorkstreamAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The workstream could not be saved.");
        return;
      }
      router.push(result.redirectTo ?? `/projects/${projectId}/workstreams`);
      router.refresh();
    });
  });

  const archive = () => {
    if (!workstreamId || !window.confirm("Archive this workstream?")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await archiveWorkstreamAction({ projectId, workstreamId });
      if (!result.success) {
        setMessage(result.message ?? "The workstream could not be archived.");
        return;
      }
      router.push(`/projects/${projectId}/workstreams`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <input type="hidden" {...register("projectId")} />
      {message ? (
        <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <FormField id="workstream-name" label="Workstream name" error={errors.name?.message}>
        <Input id="workstream-name" {...register("name")} />
      </FormField>
      <FormField id="workstream-description" label="Purpose" error={errors.description?.message}>
        <Textarea id="workstream-description" {...register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="workstream-color" label="Colour" error={errors.colorToken?.message}>
          <Input id="workstream-color" type="color" className="h-10 p-1" {...register("colorToken")} />
        </FormField>
        <FormField id="workstream-icon" label="Icon" error={errors.iconKey?.message}>
          <select id="workstream-icon" className={selectClasses} {...register("iconKey")}>
            {iconOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FormField>
        <FormField id="workstream-order" label="Display order" error={errors.sortOrder?.message}>
          <Input id="workstream-order" type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {workstreamId ? (
          <Button type="button" variant="destructive" onClick={archive} disabled={isPending}>
            <Trash2 />Archive
          </Button>
        ) : <span />}
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {workstreamId ? "Save workstream" : "Add workstream"}
        </Button>
      </div>
    </form>
  );
}
