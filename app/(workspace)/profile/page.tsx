import { KeyRound, ShieldCheck, UserCircle } from "lucide-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireWorkspaceSession } from "@/lib/auth/authorization";

export default async function ProfilePage() {
  const context = await requireWorkspaceSession();
  const { user } = context;
  const initials = user.displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your account details and keep your workspace access secure."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Account overview</CardTitle>
                <CardDescription>
                  Your identity and active workspace permissions.
                </CardDescription>
              </div>
              <UserCircle className="size-5 text-[var(--orbit-purple)]" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6556dc] to-[#3c327d] text-lg font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--orbit-text)]">
                  {user.displayName}
                </p>
                <p className="truncate text-sm text-[var(--orbit-text-muted)]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
                System roles
              </p>
              <div className="flex flex-wrap gap-2">
                {user.roleNames.length ? (
                  user.roleNames.map((role) => (
                    <StatusBadge key={role} status="in-progress" label={role} />
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Project member</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Workspace access is protected</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                  Password changes revoke your other active sessions immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Use a strong password to protect your Orbit account.
                </CardDescription>
              </div>
              <KeyRound className="size-5 text-[var(--orbit-purple)]" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm redirectTo="profile" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

