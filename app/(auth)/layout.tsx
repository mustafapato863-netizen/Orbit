import type { ReactNode } from "react";

import { OrbitMark } from "@/components/layout/orbit-mark";

export default function AuthenticationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-svh bg-muted/30 lg:grid-cols-[minmax(0,0.85fr)_minmax(32rem,1.15fr)]">
      <section className="hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <OrbitMark />
          <span className="text-lg font-semibold">Orbit</span>
        </div>
        <div className="my-auto max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sidebar-primary">
            Project command centre
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Clear delivery governance, securely shared.
          </h1>
          <p className="mt-5 text-base leading-7 text-sidebar-foreground/65">
            Sign in to your authorized workspace. Access is determined on the
            server by your role and active project memberships.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/65">
          Orbit Project Manager
        </p>
      </section>
      <section className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
