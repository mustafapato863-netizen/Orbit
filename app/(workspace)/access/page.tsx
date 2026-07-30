import { ShieldCheck, UserCheck, Users } from "lucide-react";

import { AccessAdminPanel } from "@/components/access/access-admin-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessOverview } from "@/lib/auth/access.service";
import { requirePagePermission } from "@/lib/auth/authorization";
import { SYSTEM_MANAGE_PERMISSION } from "@/lib/auth/permissions";

export default async function AccessPage() {
  const context = await requirePagePermission(SYSTEM_MANAGE_PERMISSION);
  const overview = await getAccessOverview();
  const activeUsers = overview.users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Users & access"
        description="Manage system roles, account security, and project memberships. Every operation is authorized and audited on the server."
      />
      <section
        aria-label="Access metrics"
        className="grid gap-4 sm:grid-cols-3"
      >
        <MetricCard
          label="Accounts"
          value={overview.users.length}
          description={`${activeUsers} active`}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          label="System roles"
          value={overview.roles.length}
          description="Stable permission bundles"
          icon={ShieldCheck}
          tone="purple"
        />
        <MetricCard
          label="Forced password changes"
          value={
            overview.users.filter((user) => user.mustChangePassword).length
          }
          description="Required before workspace access"
          icon={UserCheck}
          tone="amber"
        />
      </section>
      <AccessAdminPanel
        currentUserId={context.user.id}
        users={overview.users}
        roles={overview.roles}
        projects={overview.projects}
      />
    </div>
  );
}
