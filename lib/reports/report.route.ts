import { authorizationErrorResponse, requirePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { generateManagementReport, ReportDomainError } from "@/lib/reports/report.service";
import type { ReportFormat } from "@/lib/reports/report.dataset";
import { hasTrustedMutationOrigin } from "@/lib/security/origin";

export async function handleReportDownload(
  request: Request,
  format: ReportFormat,
  params: Promise<{ projectId: string }>,
) {
  try {
    if (!hasTrustedMutationOrigin(request)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const { projectId } = await params;
    const context = await requirePermission(PERMISSIONS.REPORT_EXPORT, projectId);
    const report = await generateManagementReport(context.user.id, projectId, format);
    return new Response(new Uint8Array(report.buffer), {
      status: 200,
      headers: {
        "Content-Type": report.mimeType,
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
        "Content-Length": String(report.buffer.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ReportDomainError) {
      const status = error.code === "NOT_FOUND" ? 404 : 500;
      return Response.json({ error: error.message }, { status });
    }
    return authorizationErrorResponse(error);
  }
}
