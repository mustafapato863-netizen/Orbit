"use client";

import { Archive, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveMilestoneAction,
  archiveProjectAction,
} from "@/app/(workspace)/projects/actions";
import { Button } from "@/components/ui/button";

export function ArchiveButton({
  projectId,
  milestoneId,
  label,
  actionLabel = "Archive",
}: {
  projectId: string;
  milestoneId?: string;
  label: string;
  actionLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Archive ${label}? This hides it from active views.`)) {
            return;
          }
          startTransition(async () => {
            const result = milestoneId
              ? await archiveMilestoneAction({ projectId, milestoneId })
              : await archiveProjectAction({ projectId });
            if (!result.success) {
              setMessage(result.message ?? "The item could not be archived.");
              return;
            }
            if (result.redirectTo) router.push(result.redirectTo);
            router.refresh();
          });
        }}
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Archive aria-hidden="true" />
        )}
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