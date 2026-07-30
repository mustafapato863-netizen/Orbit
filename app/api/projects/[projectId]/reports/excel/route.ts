import { handleReportDownload } from "@/lib/reports/report.route";

export const runtime = "nodejs";

export function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return handleReportDownload(request, "EXCEL", params);
}
