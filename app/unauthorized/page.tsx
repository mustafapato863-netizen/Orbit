import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <ErrorState
        className="w-full max-w-xl bg-card"
        title="Sign-in required"
        description="Your session is missing or has expired. Sign in to continue."
        action={
          <Button asChild>
            <Link href="/sign-in">Go to sign in</Link>
          </Button>
        }
      />
    </main>
  );
}
