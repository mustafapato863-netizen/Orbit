"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Workspace unavailable"
      description="The requested workspace data could not be loaded. No changes were made."
      action={
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
