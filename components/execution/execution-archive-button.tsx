"use client";

import { Archive, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveCapabilityAction,
  archiveWorkItemAction,
} from "@/app/(workspace)/projects/execution-actions";
import { Button } from "@/components/ui/button";

export function ExecutionArchiveButton({
  projectId,
  label,
  milestoneId,
  workItemId,
  sharedCapabilityId,
  actionLabel = "Archive",
}: {
  projectId: string;
  label: string;
  milestoneId?: string;
  workItemId?: string;
  sharedCapabilityId?: string;
  actionLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Archive ${label}?`)) return;
          startTransition(async () => {
            const result =
              workItemId && milestoneId
                ? await archiveWorkItemAction({
                    projectId,
                    milestoneId,
                    workItemId,
                  })
                : await archiveCapabilityAction({
                    projectId,
                    sharedCapabilityId,
                  });
            if (!result.success) {
              setMessage(result.message ?? "The record could not be archived.");
              return;
            }
            if (result.redirectTo) router.push(result.redirectTo);
            router.refresh();
          });
        }}
      >
        {isPending ? <LoaderCircle className="animate-spin" /> : <Archive />}
        {isPending ? `${actionLabel}…` : actionLabel}
      </Button>
      {message ? (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}