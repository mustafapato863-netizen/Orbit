import { Clock3, FileArchive, FileSpreadsheet, Presentation, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { reportQueries } from "@/lib/reports/report.queries";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const { project, snapshots } = await reportQueries.getWorkspace(projectId);
  if (!project) notFound();
  const canExport = hasPermission(context.user, PERMISSIONS.REPORT_EXPORT);
  const powerpointCount = snapshots.filter(({ reportType }) => reportType === "MANAGEMENT_POWERPOINT").length;
  const excelCount = snapshots.filter(({ reportType }) => reportType === "MANAGEMENT_EXCEL").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} / Management Review`}
        title="Reports & Exports"
        description="Generate a reconciled management report from one canonical project snapshot. Every Work Item is included, Shared Capabilities are counted once, and Primary versus Supporting ownership remains explicit."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Report snapshots" value={snapshots.length} icon={FileArchive} tone="blue" />
        <MetricCard label="PowerPoint reports" value={powerpointCount} icon={Presentation} tone="purple" />
        <MetricCard label="Excel review packs" value={excelCount} icon={FileSpreadsheet} tone="green" />
        <MetricCard label="Last generated" value={snapshots[0] ? formatDate(snapshots[0].generatedAt) : "Not generated"} icon={Clock3} tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div><CardTitle>Executive PowerPoint report</CardTitle><CardDescription className="mt-2">A paginated management narrative from executive position through release recommendation.</CardDescription></div>
              <Presentation className="size-6 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>Executive summary</li><li>How to read the report</li><li>Milestone roadmap</li><li>Project workstreams</li><li>Delivery pipeline</li><li>Controlled pilot</li><li>Risks and decisions</li><li>Final recommendation</li>
            </ul>
            {canExport ? <ReportDownloadButton projectId={projectId} format="powerpoint" /> : <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">You can view report history, but report export permission is required to generate a download.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div><CardTitle>Excel Management Review Pack</CardTitle><CardDescription className="mt-2">Six formatted worksheets for review, filtering, feedback and final sign-off.</CardDescription></div>
              <FileSpreadsheet className="size-6 text-emerald-600" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>Executive Summary</li><li>Milestone Review</li><li>Workstream Review</li><li>Risks & Decisions</li><li>Pilot Scope Review</li><li>Final Feedback and Sign-off</li>
            </ul>
            {canExport ? <ReportDownloadButton projectId={projectId} format="excel" /> : <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">You can view report history, but report export permission is required to generate a download.</p>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-emerald-600" /><div><CardTitle>Export integrity controls</CardTitle><CardDescription>Applied to both formats before a download is returned.</CardDescription></div></div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <p className="rounded-lg bg-muted/40 p-3">All Work Items pass an explicit coverage assertion.</p>
          <p className="rounded-lg bg-muted/40 p-3">Shared Capabilities use one canonical key and one global count.</p>
          <p className="rounded-lg bg-muted/40 p-3">Missing owners render as <strong>Owner Not Assigned</strong>.</p>
          <p className="rounded-lg bg-muted/40 p-3">Server-only secret values and secret-shaped fields are rejected.</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Report snapshot history</h2><p className="text-sm text-muted-foreground">A versioned database snapshot and audit record are committed only after file generation succeeds.</p></div>
        {!snapshots.length ? (
          <EmptyState icon={FileArchive} title="No report snapshots" description="Generate the first PowerPoint or Excel review pack to create an immutable report snapshot." />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <ul className="divide-y">
              {snapshots.map((snapshot) => (
                <li key={snapshot.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{snapshot.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Version {snapshot.version} · {formatDate(snapshot.generatedAt)} · {snapshot.generatedBy?.displayName ?? "System"}</p>
                  </div>
                  <StatusBadge status="completed" label={snapshot.reportType === "MANAGEMENT_POWERPOINT" ? "PowerPoint snapshot" : "Excel snapshot"} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

