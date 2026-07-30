"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createPilotIssueAction, updatePilotIssueAction } from "@/app/(workspace)/projects/pilot-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { createPilotIssueSchema, pilotIssueStatuses, pilotRiskLevels, type CreatePilotIssueInput } from "@/lib/pilot/pilot.schemas";
import { displayEnum } from "@/lib/projects/project.utils";

type Member = { user: { id: string; displayName: string } };

export function PilotIssueForm({
  projectId,
  issueId,
  members,
  initialValues,
}: {
  projectId: string;
  issueId?: string;
  members: Member[];
  initialValues?: CreatePilotIssueInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePilotIssueInput>({
    resolver: zodResolver(createPilotIssueSchema),
    defaultValues: initialValues ?? {
      projectId,
      title: "",
      description: "",
      severity: "MEDIUM",
      status: "OPEN",
      isBlocking: true,
      ownerId: "",
      mitigation: "",
      dueDate: "",
    },
  });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = issueId
            ? await updatePilotIssueAction({ ...values, issueId })
            : await createPilotIssueAction(values);
          if (!result.success) {
            setMessage(result.message ?? "Pilot issue could not be saved.");
            return;
          }
          router.push(`/projects/${projectId}/pilot`);
          router.refresh();
        }),
      )}
    >
      <input type="hidden" {...register("projectId")} />
      <FormField id="pilot-issue-title" label="Issue title" error={errors.title?.message}>
        <Input id="pilot-issue-title" {...register("title")} />
      </FormField>
      <FormField id="pilot-issue-description" label="Description" error={errors.description?.message}>
        <Textarea id="pilot-issue-description" {...register("description")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="pilot-issue-severity" label="Severity" error={errors.severity?.message}>
          <select id="pilot-issue-severity" className={selectClasses} {...register("severity")}>
            {pilotRiskLevels.map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}
          </select>
        </FormField>
        <FormField id="pilot-issue-status" label="Status" error={errors.status?.message}>
          <select id="pilot-issue-status" className={selectClasses} {...register("status")}>
            {pilotIssueStatuses.map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}
          </select>
        </FormField>
        <FormField id="pilot-issue-owner" label="Owner" error={errors.ownerId?.message}>
          <select id="pilot-issue-owner" className={selectClasses} {...register("ownerId")}>
            <option value="">Unassigned</option>
            {members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </FormField>
        <FormField id="pilot-issue-due" label="Due date" error={errors.dueDate?.message}>
          <Input id="pilot-issue-due" type="date" {...register("dueDate")} />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" {...register("isBlocking")} />
        Blocks Pilot readiness
      </label>
      <FormField id="pilot-issue-mitigation" label="Mitigation / resolution plan" error={errors.mitigation?.message}>
        <Textarea id="pilot-issue-mitigation" {...register("mitigation")} />
      </FormField>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        {issueId ? "Save issue" : "Create issue"}
      </Button>
    </form>
  );
}
