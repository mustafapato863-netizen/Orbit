"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createPilotTeamAction, updatePilotTeamAction } from "@/app/(workspace)/projects/pilot-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { createPilotTeamSchema, type CreatePilotTeamInput } from "@/lib/pilot/pilot.schemas";

type Member = { user: { id: string; displayName: string; email: string } };

export function PilotTeamForm({
  projectId,
  teamId,
  members,
  initialValues,
}: {
  projectId: string;
  teamId?: string;
  members: Member[];
  initialValues?: CreatePilotTeamInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePilotTeamInput>({
    resolver: zodResolver(createPilotTeamSchema),
    defaultValues: initialValues ?? {
      projectId,
      name: "",
      description: "",
      leadUserId: "",
      memberIds: [],
    },
  });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = teamId
            ? await updatePilotTeamAction({ ...values, teamId })
            : await createPilotTeamAction(values);
          if (!result.success) {
            setMessage(result.message ?? "Pilot team could not be saved.");
            return;
          }
          router.push(`/projects/${projectId}/pilot`);
          router.refresh();
        }),
      )}
    >
      <input type="hidden" {...register("projectId")} />
      <FormField id="pilot-team-name" label="Team name" error={errors.name?.message}>
        <Input id="pilot-team-name" {...register("name")} />
      </FormField>
      <FormField id="pilot-team-description" label="Description" error={errors.description?.message}>
        <Textarea id="pilot-team-description" {...register("description")} />
      </FormField>
      <FormField id="pilot-team-lead" label="Team lead" error={errors.leadUserId?.message}>
        <select id="pilot-team-lead" className={selectClasses} {...register("leadUserId")}>
          <option value="">Unassigned</option>
          {members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
        </select>
      </FormField>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Pilot users</legend>
        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {members.map(({ user }) => (
            <label key={user.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={user.id} {...register("memberIds")} />
              <span>{user.displayName}<span className="block text-xs text-muted-foreground">{user.email}</span></span>
            </label>
          ))}
        </div>
        {errors.memberIds?.message ? <p className="text-xs text-destructive">{errors.memberIds.message}</p> : null}
      </fieldset>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        {teamId ? "Save Pilot team" : "Create Pilot team"}
      </Button>
    </form>
  );
}
