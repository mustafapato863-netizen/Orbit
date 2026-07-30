"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  createRiskAction,
  updateRiskAction,
} from "@/app/(workspace)/projects/governance-actions";
import { FormField, Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  createRiskSchema,
  riskStatuses,
  type CreateRiskInput,
} from "@/lib/governance/governance.schemas";
import { deriveRiskSeverity } from "@/lib/governance/risk-severity";
import { displayEnum } from "@/lib/projects/project.utils";

type Setup = {
  workstreams: Array<{ id: string; name: string }>;
  members: Array<{ user: { id: string; displayName: string } }>;
  milestones: Array<{ id: string; code: string; name: string }>;
  workItems: Array<{ id: string; code: string; name: string; milestoneId: string }>;
  capabilities: Array<{ id: string; code: string; name: string }>;
};

export function RiskForm({
  projectId,
  riskId,
  setup,
  initialValues,
}: {
  projectId: string;
  riskId?: string;
  setup: Setup;
  initialValues?: CreateRiskInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRiskInput>({
    resolver: zodResolver(createRiskSchema),
    defaultValues: initialValues ?? {
      projectId,
      title: "",
      description: "",
      probability: 1,
      impact: 1,
      milestoneId: "",
      targetType: "NONE",
      targetId: "",
      primaryWorkstreamId: "",
      ownerId: "",
      mitigation: "",
      dueDate: "",
      status: "OPEN",
    },
  });
  const targetType = useWatch({ control, name: "targetType" });
  const probability = useWatch({ control, name: "probability" });
  const impact = useWatch({ control, name: "impact" });
  const severity = deriveRiskSeverity(probability || 1, impact || 1).toLowerCase() as
    | "low"
    | "medium"
    | "high"
    | "critical";

  const submit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = riskId
        ? await updateRiskAction({ ...values, riskId })
        : await createRiskAction(values);
      if (!result.success) {
        setMessage(result.message ?? "The Risk could not be saved.");
        return;
      }
      router.push(result.redirectTo ?? `/projects/${projectId}/risks`);
      router.refresh();
    });
  });

  const targetOptions =
    targetType === "WORK_ITEM"
      ? setup.workItems
      : targetType === "SHARED_CAPABILITY"
        ? setup.capabilities
        : [];

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <input type="hidden" {...register("projectId")} />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <FormField id="risk-title" label="Risk title" error={errors.title?.message}>
        <Input id="risk-title" {...register("title")} />
      </FormField>
      <FormField id="risk-description" label="Description" error={errors.description?.message}>
        <Textarea id="risk-description" {...register("description")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="risk-probability" label="Probability (1–5)" error={errors.probability?.message}>
          <Input id="risk-probability" type="number" min={1} max={5} {...register("probability", { valueAsNumber: true })} />
        </FormField>
        <FormField id="risk-impact" label="Impact (1–5)" error={errors.impact?.message}>
          <Input id="risk-impact" type="number" min={1} max={5} {...register("impact", { valueAsNumber: true })} />
        </FormField>
        <div className="space-y-2">
          <p className="text-sm font-medium">Derived severity</p>
          <div className="flex h-9 items-center"><RiskBadge level={severity} /></div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="risk-milestone" label="Related Milestone" error={errors.milestoneId?.message}>
          <select id="risk-milestone" className={selectClasses} {...register("milestoneId")}>
            <option value="">Project-level</option>
            {setup.milestones.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
          </select>
        </FormField>
        <FormField id="risk-workstream" label="Primary Workstream" error={errors.primaryWorkstreamId?.message}>
          <select id="risk-workstream" className={selectClasses} {...register("primaryWorkstreamId")}>
            <option value="">Cross-workstream</option>
            {setup.workstreams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="risk-target-type" label="Related delivery work" error={errors.targetType?.message}>
          <select id="risk-target-type" className={selectClasses} {...register("targetType")}>
            <option value="NONE">No related item</option>
            <option value="WORK_ITEM">Work Item</option>
            <option value="SHARED_CAPABILITY">Shared Capability</option>
          </select>
        </FormField>
        <FormField id="risk-target" label="Related Work Item or Shared Capability" error={errors.targetId?.message}>
          <select id="risk-target" className={selectClasses} disabled={targetType === "NONE"} {...register("targetId")}>
            <option value="">Select an item</option>
            {targetOptions.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="risk-owner" label="Owner" error={errors.ownerId?.message}>
          <select id="risk-owner" className={selectClasses} {...register("ownerId")}>
            <option value="">Unassigned</option>
            {setup.members.map(({ user }) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </FormField>
        <FormField id="risk-due" label="Due date" error={errors.dueDate?.message}>
          <Input id="risk-due" type="date" {...register("dueDate")} />
        </FormField>
        <FormField id="risk-status" label="Status" error={errors.status?.message}>
          <select id="risk-status" className={selectClasses} {...register("status")}>
            {riskStatuses.map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}
          </select>
        </FormField>
      </div>
      <FormField id="risk-mitigation" label="Mitigation" error={errors.mitigation?.message}>
        <Textarea id="risk-mitigation" {...register("mitigation")} />
      </FormField>
      <div className="flex justify-end">
        <Button disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isPending ? "Saving…" : riskId ? "Save Risk" : "Create Risk"}
        </Button>
      </div>
    </form>
  );
}
