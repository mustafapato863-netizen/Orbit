"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const description = error.digest
    ? `The requested workspace data could not be loaded. Reference ID: ${error.digest}. No changes were made.`
    : "The requested workspace data could not be loaded. No changes were made.";

  return (
    <ErrorState
      title="Workspace unavailable"
      description={description}
      action={
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
