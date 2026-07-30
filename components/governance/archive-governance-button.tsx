"use client";

import { Archive, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { archiveDecisionAction, archiveRiskAction } from "@/app/(workspace)/projects/governance-actions";
import { Button } from "@/components/ui/button";

export function ArchiveGovernanceButton({
  projectId,
  entityId,
  entity,
}: {
  projectId: string;
  entityId: string;
  entity: "risk" | "decision";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Archive this ${entity}?`)) return;
          startTransition(async () => {
            const result = entity === "risk"
              ? await archiveRiskAction({ projectId, riskId: entityId })
              : await archiveDecisionAction({ projectId, decisionId: entityId });
            if (!result.success) {
              setMessage(result.message ?? `The ${entity} could not be archived.`);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Archive />}
        Archive
      </Button>
      {message ? <p role="alert" className="mt-2 text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
