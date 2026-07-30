import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function generateReportSamples() {
  const [
    { prisma },
    { ReportRepository },
    { buildReportDataset, assertReportDatasetComplete },
    { generatePowerPointReport },
    { generateExcelReport },
    { assertDatasetContainsNoSecrets },
  ] = await Promise.all([
    import("../lib/prisma"),
    import("../lib/reports/report.repository"),
    import("../lib/reports/report.dataset"),
    import("../lib/reports/powerpoint"),
    import("../lib/reports/excel"),
    import("../lib/reports/report.service"),
  ]);

  try {
    const project = await prisma.project.findUnique({
      where: { code: "PMS" },
      select: { id: true },
    });
    const source = await new ReportRepository(prisma).findProjectSource(
      project?.id ?? "",
    );
    if (!source) {
      throw new Error(
        "The seeded PMS project was not found. Run npm run prisma:seed first.",
      );
    }

    const dataset = buildReportDataset(source);
    assertReportDatasetComplete(dataset);
    assertDatasetContainsNoSecrets(dataset);
    const [powerPoint, excel] = await Promise.all([
      generatePowerPointReport(dataset),
      generateExcelReport(dataset),
    ]);
    const output = resolve("samples", "reports");
    await mkdir(output, { recursive: true });
    await Promise.all([
      writeFile(
        resolve(output, "pms-dashboard-management-report.pptx"),
        powerPoint,
      ),
      writeFile(
        resolve(output, "pms-dashboard-management-review.xlsx"),
        excel,
      ),
    ]);

    return {
      workItems: dataset.metrics.workItems,
      sharedCapabilities: dataset.metrics.sharedCapabilities,
    };
  } finally {
    await prisma.$disconnect();
  }
}

