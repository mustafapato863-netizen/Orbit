"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createDecisionAction, updateDecisionAction } from "@/app/(workspace)/projects/governance-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import {
  createDecisionSchema,
  decisionStatuses,
  type CreateDecisionInput,
} from "@/lib/governance/governance.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

type Setup = {
  workstreams: Array<{ id: string; name: string }>;
  members: Array<{ user: { id: string; displayName: string } }>;
  milestones: Array<{ id: string; code: string; name: string }>;
};

export function DecisionForm({
  projectId,
  decisionId,
  setup,
  initialValues,
}: {
  projectId: string;
  decisionId?: string;
  setup: Setup;
  initialValues?: CreateDecisionInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateDecisionInput>({
    resolver: zodResolver(createDecisionSchema),
    defaultValues: initialValues ?? {
      projectId,
      title: "",
      description: "",
      milestoneId: "",
      affectedWorkstreamIds: [],
      requiredBy: "",
      recommendedDirection: "",
      ownerId: "",
      status: "PENDING",
      decisionText: "",
    },
  });
  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = decisionId
        ? await updateDecisionAction({ ...values, decisionId })
        : await createDecisionAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The Decision could not be saved.");
        return;
      }
      router.push(result.redirectTo ?? `/projects/${projectId}/risks`);
      router.refresh();
    });
  });
  const availableStatuses = decisionStatuses.filter(
    (value) =>
      !["APPROVED", "REJECTED"].includes(value) ||
      value === initialValues?.status,
  );

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <input type="hidden" {...register("projectId")} />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <FormField id="decision-title" label="Required decision" error={errors.title?.message}>
        <Input id="decision-title" {...register("title")} />
      </FormField>
      <FormField id="decision-description" label="Context and decision needed" error={errors.description?.message}>
        <Textarea id="decision-description" {...register("description")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="decision-milestone" label="Related Milestone" error={errors.milestoneId?.message}>
          <select id="decision-milestone" className={selectClasses} {...register("milestoneId")}>
            <option value="">Project-level</option>
            {setup.milestones.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
          </select>
        </FormField>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Affected Workstreams</legend>
          <div className="flex min-h-9 flex-wrap gap-4 rounded-md border px-3 py-2">
            {setup.workstreams.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={item.id} {...register("affectedWorkstreamIds")} />
                {item.name}
              </label>
            ))}
          </div>
          {errors.affectedWorkstreamIds?.message ? <p className="text-xs text-destructive">{errors.affectedWorkstreamIds.message}</p> : null}
        </fieldset>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="decision-required-by" label="Required-by date" error={errors.requiredBy?.message}>
          <Input id="decision-required-by" type="date" {...register("requiredBy")} />
        </FormField>
        <FormField id="decision-owner" label="Decision owner" error={errors.ownerId?.message}>
          <select id="decision-owner" className={selectClasses} {...register("ownerId")}>
            <option value="">Unassigned</option>
            {setup.members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </FormField>
        <FormField id="decision-status" label="Status" error={errors.status?.message}>
          <select id="decision-status" className={selectClasses} {...register("status")}>
            {availableStatuses.map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}
          </select>
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">
        Approved and Rejected outcomes are recorded through the Reviewer action.
      </p>
      <FormField id="decision-recommendation" label="Recommended direction" error={errors.recommendedDirection?.message}>
        <Textarea id="decision-recommendation" {...register("recommendedDirection")} />
      </FormField>
      <FormField id="decision-text" label="Recorded decision" error={errors.decisionText?.message}>
        <Textarea id="decision-text" {...register("decisionText")} />
      </FormField>
      <div className="flex justify-end">
        <Button disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isPending ? "Saving…" : decisionId ? "Save Decision" : "Create Decision"}
        </Button>
      </div>
    </form>
  );
}
