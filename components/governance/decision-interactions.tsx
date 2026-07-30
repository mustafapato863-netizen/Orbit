"use client";

import { LoaderCircle, MessageSquarePlus, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addDecisionCommentAction, reviewDecisionAction } from "@/app/(workspace)/projects/governance-actions";
import { Input, selectClasses, Textarea } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";

export function DecisionReviewForm({
  projectId,
  decisionId,
}: {
  projectId: string;
  decisionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await reviewDecisionAction({
            projectId,
            decisionId,
            status: data.get("status"),
            decisionText: data.get("decisionText"),
            comment: data.get("comment"),
          });
          setMessage(result.success ? "Review recorded." : result.message ?? "Review failed.");
          if (result.success) {
            event.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Review outcome
          <select name="status" className={selectClasses} defaultValue="APPROVED">
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
            <option value="DEFERRED">Defer</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          Decision record
          <Input name="decisionText" required minLength={2} />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        Review comment (optional)
        <Textarea name="comment" />
      </label>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Scale />}
        Record review
      </Button>
    </form>
  );
}

export function DecisionCommentForm({
  projectId,
  decisionId,
}: {
  projectId: string;
  decisionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = await addDecisionCommentAction({
            projectId,
            decisionId,
            body: data.get("body"),
          });
          setMessage(result.success ? "Comment added." : result.message ?? "Comment failed.");
          if (result.success) {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <label className="block space-y-2 text-sm font-medium">
        Add comment
        <Textarea name="body" required />
      </label>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      <Button variant="outline" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <MessageSquarePlus />}
        Add comment
      </Button>
    </form>
  );
}
