"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createPilotCriterionAction, updatePilotCriterionAction } from "@/app/(workspace)/projects/pilot-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { createPilotCriterionSchema, type CreatePilotCriterionInput } from "@/lib/pilot/pilot.schemas";

export function PilotCriterionForm({
  projectId,
  criterionId,
  initialValues,
}: {
  projectId: string;
  criterionId?: string;
  initialValues?: CreatePilotCriterionInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePilotCriterionInput>({
    resolver: zodResolver(createPilotCriterionSchema),
    defaultValues: initialValues ?? {
      projectId,
      code: "",
      type: "ENTRY",
      title: "",
      description: "",
      isRequired: true,
    },
  });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = criterionId
            ? await updatePilotCriterionAction({ ...values, criterionId })
            : await createPilotCriterionAction(values);
          if (!result.success) {
            setMessage(result.message ?? "Criterion could not be saved.");
            return;
          }
          router.push(`/projects/${projectId}/pilot`);
          router.refresh();
        }),
      )}
    >
      <input type="hidden" {...register("projectId")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="criterion-code" label="Code" error={errors.code?.message}>
          <Input id="criterion-code" {...register("code")} />
        </FormField>
        <FormField id="criterion-type" label="Gate" error={errors.type?.message}>
          <select id="criterion-type" className={selectClasses} {...register("type")}>
            <option value="ENTRY">Entry criterion</option>
            <option value="EXIT">Exit criterion</option>
          </select>
        </FormField>
      </div>
      <FormField id="criterion-title" label="Criterion" error={errors.title?.message}>
        <Input id="criterion-title" {...register("title")} />
      </FormField>
      <FormField id="criterion-description" label="Description" error={errors.description?.message}>
        <Textarea id="criterion-description" {...register("description")} />
      </FormField>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" {...register("isRequired")} />
        Required for gate readiness
      </label>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        {criterionId ? "Save criterion" : "Create criterion"}
      </Button>
    </form>
  );
}
