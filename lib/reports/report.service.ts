import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  assertReportDatasetComplete,
  buildReportDataset,
  reportDatasetChecksum,
  type ReportDataset,
  type ReportFormat,
} from "@/lib/reports/report.dataset";
import { generateExcelReport } from "@/lib/reports/excel";
import { generatePowerPointReport } from "@/lib/reports/powerpoint";
import { ReportRepository } from "@/lib/reports/report.repository";

const FORMAT_CONFIG = {
  POWERPOINT: {
    reportType: "MANAGEMENT_POWERPOINT",
    extension: "pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    title: "Executive Management Report",
  },
  EXCEL: {
    reportType: "MANAGEMENT_EXCEL",
    extension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    title: "Excel Management Review Pack",
  },
} as const;

export class ReportDomainError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "SECRET_DETECTED" | "GENERATION_FAILED") {
    super(message);
    this.name = "ReportDomainError";
  }
}

function fileSafe(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "project";
}

function jsonValue(dataset: ReportDataset) {
  return JSON.parse(JSON.stringify(dataset)) as Prisma.InputJsonValue;
}

export function assertDatasetContainsNoSecrets(dataset: ReportDataset) {
  const serialized = JSON.stringify(dataset);
  const forbiddenKeys = /"[^"\\]*(password|secret|token|database[_-]?url|auth[_-]?secret)[^"\\]*"\s*:/i;
  const secretValues = [env.DATABASE_URL, env.AUTH_SECRET].filter(
    (value): value is string => typeof value === "string" && value.length >= 8,
  );
  if (forbiddenKeys.test(serialized) || secretValues.some((value) => serialized.includes(value))) {
    throw new ReportDomainError(
      "The report contains a forbidden secret value and was not generated.",
      "SECRET_DETECTED",
    );
  }
}

async function createFile(dataset: ReportDataset, format: ReportFormat) {
  try {
    return format === "POWERPOINT"
      ? await generatePowerPointReport(dataset)
      : await generateExcelReport(dataset);
  } catch (error) {
    if (error instanceof ReportDomainError) throw error;
    throw new ReportDomainError("The report file could not be generated.", "GENERATION_FAILED");
  }
}

async function persistSnapshot(
  actorId: string,
  format: ReportFormat,
  dataset: ReportDataset,
  checksum: string,
  fileName: string,
) {
  const config = FORMAT_CONFIG[format];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (database) => {
          const repository = new ReportRepository(database);
          const snapshot = await repository.createSnapshot({
            projectId: dataset.project.id,
            generatedById: actorId,
            reportType: config.reportType,
            title: `${dataset.project.name} — ${config.title}`,
            parameters: {
              format,
              fileName,
              checksum,
              schemaVersion: dataset.schemaVersion,
            },
            snapshot: jsonValue(dataset),
          });
          await recordAuditEntry(database, {
            actorId,
            projectId: dataset.project.id,
            action: "report.generated",
            entityType: "ReportSnapshot",
            entityId: snapshot.id,
            afterState: {
              reportType: config.reportType,
              version: snapshot.version,
              format,
              checksum,
            },
            metadata: {
              fileName,
              canonicalPackageCount: dataset.metrics.canonicalPackages,
              workItemCount: dataset.metrics.workItems,
              sharedCapabilityCount: dataset.metrics.sharedCapabilities,
            },
          });
          return snapshot;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : null;
      if ((code === "P2034" || code === "P2002") && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error("Report snapshot transaction retry limit reached.");
}

export async function generateManagementReport(
  actorId: string,
  projectId: string,
  format: ReportFormat,
  generatedAt = new Date(),
) {
  const source = await new ReportRepository(prisma).findProjectSource(projectId);
  if (!source) throw new ReportDomainError("Project not found.", "NOT_FOUND");

  const dataset = buildReportDataset(source, generatedAt);
  assertReportDatasetComplete(dataset);
  assertDatasetContainsNoSecrets(dataset);
  const buffer = await createFile(dataset, format);
  const checksum = reportDatasetChecksum(dataset);
  const config = FORMAT_CONFIG[format];
  const fileName = `${fileSafe(source.code)}-${fileSafe(source.name)}-management-review-v${dataset.schemaVersion}.${config.extension}`;
  const snapshot = await persistSnapshot(actorId, format, dataset, checksum, fileName);

  return {
    buffer,
    fileName,
    mimeType: config.mimeType,
    snapshot,
    dataset,
    checksum,
  };
}

