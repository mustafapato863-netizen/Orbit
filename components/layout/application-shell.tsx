import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { SessionUser } from "@/lib/auth/session";

type ApplicationShellProps = {
  children: ReactNode;
  user: SessionUser;
};

export function ApplicationShell({ children, user }: ApplicationShellProps) {
  return (
    <div className="flex min-h-svh bg-[var(--orbit-bg)]">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 lg:px-7 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
