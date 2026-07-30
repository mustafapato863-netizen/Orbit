import ExcelJS from "exceljs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { generateExcelReport } from "@/lib/reports/excel";
import { buildReportDataset, OWNER_NOT_ASSIGNED } from "@/lib/reports/report.dataset";
import { createReportSourceFixture } from "@/lib/reports/report.test-fixture";
import { generatePowerPointReport } from "@/lib/reports/powerpoint";

async function packageXml(buffer: Buffer, prefix: string) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((name) => name.startsWith(prefix) && name.endsWith(".xml"));
  return {
    zip,
    names,
    text: (await Promise.all(names.map((name) => zip.file(name)!.async("string")))).join("\n"),
  };
}

function worksheetText(sheet: ExcelJS.Worksheet) {
  const values: string[] = [];
  sheet.eachRow((row) => row.eachCell({ includeEmpty: false }, (cell) => values.push(String(cell.value ?? ""))));
  return values.join("\n");
}

describe("management report files", () => {
  const dataset = buildReportDataset(createReportSourceFixture(), new Date("2026-07-25T12:00:00.000Z"));

  it("creates a paginated PowerPoint whose OOXML contains every Work Item", async () => {
    const buffer = await generatePowerPointReport(dataset);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    const report = await packageXml(buffer, "ppt/slides/slide");

    expect(report.names.length).toBeGreaterThanOrEqual(12);
    for (const item of dataset.workItems) expect(report.text).toContain(item.name);
    expect(report.text.toLowerCase()).toContain("how to read this report");
    expect(report.text.toLowerCase()).toContain("business milestone roadmap");
    expect(report.text.toLowerCase()).toContain("project workstream breakdown");
    expect(report.text.toLowerCase()).toContain("delivery pipeline");
    expect(report.text.toLowerCase()).toContain("controlled pilot");
    expect(report.text.toLowerCase()).toContain("final release recommendation");
    expect(report.text).toContain(OWNER_NOT_ASSIGNED);
    expect(report.text.toLowerCase()).not.toContain("database_url");
    expect(report.text.toLowerCase()).not.toContain("auth_secret");
  }, 30_000);

  it("creates the six-sheet Excel review pack with typed coverage", async () => {
    const buffer = await generateExcelReport(dataset);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    expect(workbook.worksheets.map(({ name }) => name)).toEqual([
      "Executive Summary",
      "Milestone Review",
      "Workstream Review",
      "Risks & Decisions",
      "Pilot Scope Review",
      "Final Feedback and Sign-off",
    ]);
    const milestone = workbook.getWorksheet("Milestone Review")!;
    const milestoneText = worksheetText(milestone);
    for (const item of dataset.workItems) expect(milestoneText).toContain(item.name);
    expect(milestoneText.match(/Canonical Shared Capability/g)).toHaveLength(1);
    expect(milestoneText).toContain(OWNER_NOT_ASSIGNED);

    const workstreamText = worksheetText(workbook.getWorksheet("Workstream Review")!);
    expect(workstreamText).toContain("Primary");
    expect(workstreamText).toContain("Supporting");
    expect(workbook.getWorksheet("Final Feedback and Sign-off")!.getCell("C25").dataValidation.type).toBe("list");

    const archive = await packageXml(buffer, "xl/");
    expect(archive.text.toLowerCase()).not.toContain("database_url");
    expect(archive.text.toLowerCase()).not.toContain("auth_secret");
  }, 30_000);
});


