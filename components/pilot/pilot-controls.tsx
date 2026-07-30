"use client";

import { Archive, CheckCircle2, LoaderCircle, Save, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archivePilotIssueAction,
  archivePilotTeamAction,
  reviewFinalPilotDecisionAction,
  reviewPilotCriterionAction,
  reviewPilotSignOffAction,
  setPilotCapabilityAction,
} from "@/app/(workspace)/projects/pilot-actions";
import { Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";

export function PilotCapabilityControl({
  projectId,
  sharedCapabilityId,
  initialDisposition = "INCLUDED",
  initialNotes = "",
}: {
  projectId: string;
  sharedCapabilityId: string;
  initialDisposition?: "INCLUDED" | "DEFERRED";
  initialNotes?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await setPilotCapabilityAction({
            projectId,
            sharedCapabilityId,
            disposition: data.get("disposition"),
            notes: data.get("notes"),
          });
          setMessage(result.success ? "Scope updated." : result.message ?? "Scope could not be updated.");
          if (result.success) router.refresh();
        });
      }}
    >
      <label className="space-y-1 text-xs font-medium">
        Pilot disposition
        <select name="disposition" className={selectClasses} defaultValue={initialDisposition}>
          <option value="INCLUDED">Included in Pilot</option>
          <option value="DEFERRED">Deferred after Pilot</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium">
        Scope notes
        <Input name="notes" defaultValue={initialNotes} />
      </label>
      <Button size="sm" variant="outline" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        Save
      </Button>
      {message ? <p role="status" className="text-xs text-muted-foreground sm:col-span-3">{message}</p> : null}
    </form>
  );
}

export function PilotCriterionReviewForm({
  projectId,
  criterionId,
}: {
  projectId: string;
  criterionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await reviewPilotCriterionAction({
            projectId,
            criterionId,
            status: data.get("status"),
            evidence: data.get("evidence"),
          });
          setMessage(result.success ? "Criterion review recorded." : result.message ?? "Review failed.");
          if (result.success) router.refresh();
        });
      }}
    >
      <label className="space-y-1 text-xs font-medium">
        Outcome
        <select name="status" className={selectClasses}>
          <option value="MET">Met</option>
          <option value="NOT_MET">Not met</option>
          <option value="WAIVED">Waived</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium">
        Evidence
        <Input name="evidence" required minLength={2} />
      </label>
      <Button size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
        Review
      </Button>
      {message ? <p role="status" className="text-xs text-muted-foreground sm:col-span-3">{message}</p> : null}
    </form>
  );
}

export function PilotSignOffReviewForm({
  projectId,
  signOff,
}: {
  projectId: string;
  signOff: "BUSINESS" | "TECHNICAL";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await reviewPilotSignOffAction({
            projectId,
            signOff,
            outcome: data.get("outcome"),
            notes: data.get("notes"),
          });
          setMessage(result.success ? `${signOff === "BUSINESS" ? "Business" : "Technical"} sign-off recorded.` : result.message ?? "Sign-off failed.");
          if (result.success) router.refresh();
        });
      }}
    >
      <select name="outcome" className={selectClasses}>
        <option value="APPROVED">Approve</option>
        <option value="REJECTED">Reject</option>
      </select>
      <Textarea name="notes" required minLength={2} placeholder="Approval or rejection evidence" />
      {message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}
      <Button size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Scale />}
        Record sign-off
      </Button>
    </form>
  );
}

export function FinalPilotDecisionForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await reviewFinalPilotDecisionAction({
            projectId,
            status: data.get("status"),
            finalDecision: data.get("finalDecision"),
          });
          setMessage(result.success ? "Final Pilot decision recorded." : result.message ?? "Decision failed.");
          if (result.success) router.refresh();
        });
      }}
    >
      <select name="status" className={selectClasses}>
        <option value="APPROVED">Approve Pilot</option>
        <option value="REJECTED">Reject Pilot</option>
        <option value="DEFERRED">Defer decision</option>
      </select>
      <Textarea name="finalDecision" required minLength={2} placeholder="Decision and conditions" />
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Scale />}
        Record final decision
      </Button>
    </form>
  );
}

export function ArchivePilotRecordButton({
  projectId,
  recordId,
  type,
}: {
  projectId: string;
  recordId: string;
  type: "team" | "issue";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Archive this Pilot ${type}?`)) return;
          startTransition(async () => {
            const result =
              type === "team"
                ? await archivePilotTeamAction({ projectId, teamId: recordId })
                : await archivePilotIssueAction({ projectId, issueId: recordId });
            if (!result.success) {
              setMessage(result.message ?? "Archive failed.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Archive />}
        Archive
      </Button>
      {message ? <p role="alert" className="mt-1 text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
