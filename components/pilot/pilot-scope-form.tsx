"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { savePilotScopeAction } from "@/app/(workspace)/projects/pilot-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { pilotScopeSchema, type PilotScopeInput } from "@/lib/pilot/pilot.schemas";

type Member = { user: { id: string; displayName: string } };

export function PilotScopeForm({
  projectId,
  members,
  initialValues,
}: {
  projectId: string;
  members: Member[];
  initialValues?: PilotScopeInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<PilotScopeInput>({
    resolver: zodResolver(pilotScopeSchema),
    defaultValues: initialValues ?? {
      projectId,
      name: "Controlled Pilot",
      knownLimitations: "",
      supportOwnerId: "",
      rollbackOwnerId: "",
    },
  });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          const result = await savePilotScopeAction(values);
          setMessage(result.success ? "Pilot overview saved." : result.message ?? "Pilot overview could not be saved.");
          if (result.success) router.refresh();
        }),
      )}
    >
      <input type="hidden" {...register("projectId")} />
      <FormField id="pilot-name" label="Pilot name" error={errors.name?.message}>
        <Input id="pilot-name" {...register("name")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="pilot-support-owner" label="Support owner" error={errors.supportOwnerId?.message}>
          <select id="pilot-support-owner" className={selectClasses} {...register("supportOwnerId")}>
            <option value="">Unassigned</option>
            {members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </FormField>
        <FormField id="pilot-rollback-owner" label="Rollback owner" error={errors.rollbackOwnerId?.message}>
          <select id="pilot-rollback-owner" className={selectClasses} {...register("rollbackOwnerId")}>
            <option value="">Unassigned</option>
            {members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </FormField>
      </div>
      <FormField id="pilot-limitations" label="Known limitations" error={errors.knownLimitations?.message}>
        <Textarea id="pilot-limitations" {...register("knownLimitations")} />
      </FormField>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        Save Pilot overview
      </Button>
    </form>
  );
}
