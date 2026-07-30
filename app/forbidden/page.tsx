import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <ErrorState
        className="w-full max-w-xl bg-card"
        title="Access denied"
        description="You are signed in, but your role or project membership does not authorize this area."
        action={
          <Button asChild variant="outline">
            <Link href="/">Return to workspace</Link>
          </Button>
        }
      />
    </main>
  );
}
