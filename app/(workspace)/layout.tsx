import type { ReactNode } from "react";

import { ApplicationShell } from "@/components/layout/application-shell";
import { requireWorkspaceSession } from "@/lib/auth/authorization";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireWorkspaceSession();

  return <ApplicationShell user={session.user}>{children}</ApplicationShell>;
}
