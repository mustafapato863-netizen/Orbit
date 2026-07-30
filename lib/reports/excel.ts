import ExcelJS from "exceljs";

import { PIPELINE_STAGES } from "@/lib/pipeline/pipeline";
import type { ReportDataset } from "@/lib/reports/report.dataset";

const COLORS = {
  navy: "FF0B1220",
  navy2: "FF14213D",
  blue: "FF2563EB",
  green: "FF059669",
  orange: "FFEA580C",
  purple: "FF7C3AED",
  red: "FFDC2626",
  amber: "FFD97706",
  white: "FFFFFFFF",
  ink: "FF172033",
  muted: "FF64748B",
  pale: "FFF4F7FB",
  border: "FFD9E2EF",
};

function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function asDate(value: string | null) {
  return value ? new Date(value) : null;
}

function addPageBreaks(sheet: ExcelJS.Worksheet, firstDataRow: number, lastRow: number, every = 34) {
  for (let row = firstDataRow + every; row < lastRow; row += every) {
    sheet.getRow(row).addPageBreak();
  }
}

function configureSheet(sheet: ExcelJS.Worksheet, landscape = true) {
  sheet.properties.defaultRowHeight = 19;
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 4, showGridLines: false }];
  sheet.pageSetup = {
    orientation: landscape ? "landscape" : "portrait",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.55, bottom: 0.55, header: 0.2, footer: 0.2 },
  };
  sheet.headerFooter.oddFooter = "&LOrbit Project Manager&CManagement Review Pack&RPage &P of &N";
}

function addTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  width: number,
) {
  sheet.mergeCells(1, 1, 1, width);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: "Aptos Display", size: 20, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 34;
  sheet.mergeCells(2, 1, 2, width);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { name: "Aptos", size: 10, color: { argb: COLORS.muted } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  sheet.getRow(2).height = 28;
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy2 } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.blue } } };
  });
}

function styleDataRange(sheet: ExcelJS.Worksheet, firstRow: number, lastRow: number, lastColumn: number) {
  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      if (column > lastColumn) return;
      cell.font = { name: "Aptos", size: 9.5, color: { argb: COLORS.ink } };
      cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: COLORS.border } } };
      if (rowNumber % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
    row.height = 34;
  }
}

function sectionRow(sheet: ExcelJS.Worksheet, rowNumber: number, title: string, width: number) {
  sheet.mergeCells(rowNumber, 1, rowNumber, width);
  const cell = sheet.getCell(rowNumber, 1);
  cell.value = title;
  cell.font = { name: "Aptos", size: 12, bold: true, color: { argb: COLORS.navy } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF7" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(rowNumber).height = 26;
}

function setDateColumn(sheet: ExcelJS.Worksheet, columns: number[], first: number, last: number) {
  for (const column of columns) {
    for (let row = first; row <= last; row += 1) {
      sheet.getCell(row, column).numFmt = "dd mmm yyyy";
    }
  }
}

function addExecutiveSummary(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Executive Summary", { properties: { tabColor: { argb: COLORS.blue } } });
  configureSheet(sheet, false);
  addTitle(sheet, `${dataset.project.name} — Executive Summary`, `Snapshot generated ${new Date(dataset.generatedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC · Derived planning progress is not earned value.`, 8);
  sheet.columns = [
    { key: "a", width: 25 }, { key: "b", width: 22 }, { key: "c", width: 4 }, { key: "d", width: 25 },
    { key: "e", width: 22 }, { key: "f", width: 4 }, { key: "g", width: 24 }, { key: "h", width: 24 },
  ];
  const cards = [
    ["Project status", enumLabel(dataset.project.status), "Derived planning progress", dataset.project.derivedPlanningProgress / 100],
    ["Business Milestones", dataset.metrics.milestones, "Canonical work packages", dataset.metrics.canonicalPackages],
    ["Milestone-Specific Work Items", dataset.metrics.workItems, "Canonical Shared Capabilities", dataset.metrics.sharedCapabilities],
    ["High-risk packages", dataset.metrics.highRisk, "Blocked packages", dataset.metrics.blocked],
    ["Release 1 progress", dataset.metrics.releaseOneProgress / 100, "Production packages", dataset.metrics.productionCount],
  ];
  let rowNumber = 4;
  for (const [leftLabel, leftValue, rightLabel, rightValue] of cards) {
    sheet.getCell(rowNumber, 1).value = leftLabel;
    sheet.getCell(rowNumber, 2).value = leftValue;
    sheet.getCell(rowNumber, 4).value = rightLabel;
    sheet.getCell(rowNumber, 5).value = rightValue;
    for (const column of [1, 4]) {
      sheet.getCell(rowNumber, column).font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORS.muted } };
    }
    for (const column of [2, 5]) {
      const cell = sheet.getCell(rowNumber, column);
      cell.font = { name: "Aptos Display", size: 16, bold: true, color: { argb: COLORS.navy } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.pale } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    if (rowNumber === 4) sheet.getCell(rowNumber, 5).numFmt = "0%";
    if (rowNumber === 8) sheet.getCell(rowNumber, 2).numFmt = "0%";
    sheet.getRow(rowNumber).height = 32;
    rowNumber += 1;
  }
  sectionRow(sheet, 10, "Delivery-stage distribution", 8);
  sheet.getRow(11).values = ["Stage", ...PIPELINE_STAGES.map((stage) => dataset.metrics.stageLabels[stage])];
  styleHeader(sheet.getRow(11));
  sheet.getRow(12).values = ["Canonical packages", ...PIPELINE_STAGES.map((stage) => dataset.metrics.stageCounts[stage])];
  styleDataRange(sheet, 12, 12, 8);
  sectionRow(sheet, 14, "Final release recommendation", 8);
  sheet.mergeCells(15, 1, 17, 8);
  const recommendation = sheet.getCell(15, 1);
  recommendation.value = dataset.releaseRecommendation;
  recommendation.font = { name: "Aptos Display", size: 14, bold: true, color: { argb: COLORS.white } };
  recommendation.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy2 } };
  recommendation.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  sectionRow(sheet, 19, "Project window", 8);
  sheet.getRow(20).values = ["Start date", asDate(dataset.project.startDate), "Target date", asDate(dataset.project.targetDate), "Project code", dataset.project.code, "Snapshot schema", dataset.schemaVersion];
  setDateColumn(sheet, [2, 4], 20, 20);
  sheet.pageSetup.printArea = "A1:H20";
}

function addMilestoneReview(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Milestone Review", { properties: { tabColor: { argb: COLORS.purple } } });
  configureSheet(sheet);
  const headers = ["Row Type", "Business Milestone", "Release", "Package Code", "Package Name", "Package Type", "Primary Workstream", "Supporting Workstreams", "Status", "Progress", "Delivery Stage", "Risk", "Owner", "Start Date", "Due Date", "Next Gate", "Blocker", "Purpose / Description", "Shared Dependency References"];
  addTitle(sheet, "Milestone Review", "Milestone summaries followed by every Milestone-Specific Work Item. Canonical Shared Capabilities appear once in the final section.", headers.length);
  sheet.getRow(4).values = headers;
  styleHeader(sheet.getRow(4));
  const rows: unknown[][] = [];
  for (const milestone of dataset.milestones) {
    rows.push([
      "Milestone Summary", milestone.name, enumLabel(milestone.releaseHorizon), milestone.code, milestone.name, "Business Milestone", "—", "—",
      enumLabel(milestone.status), milestone.progress / 100, enumLabel(milestone.deliveryStage), enumLabel(milestone.riskLevel), "—",
      asDate(milestone.startDate), asDate(milestone.dueDate), milestone.nextAction, milestone.currentBlockers, milestone.businessPurpose,
      milestone.sharedDependencies.map(({ code, name }) => `${code} ${name}`).join("; ") || "None",
    ]);
    for (const item of milestone.workItems) {
      rows.push([
        "Milestone-Specific Work", milestone.name, enumLabel(milestone.releaseHorizon), item.code, item.name, item.kind,
        item.primaryWorkstream, item.supportingWorkstreams.join(", ") || "None", enumLabel(item.status), item.progress / 100,
        enumLabel(item.deliveryStage), enumLabel(item.riskLevel), item.owner, asDate(item.startDate), asDate(item.dueDate), item.nextGate,
        item.blocker, item.description, "—",
      ]);
    }
  }
  for (const capability of dataset.sharedCapabilities) {
    rows.push([
      "Canonical Shared Capability", capability.milestoneNames.join("; ") || "Project-wide", "Cross-release", capability.code,
      capability.name, capability.kind, capability.primaryWorkstream, capability.supportingWorkstreams.join(", ") || "None",
      enumLabel(capability.status), capability.progress / 100, enumLabel(capability.deliveryStage), enumLabel(capability.riskLevel),
      capability.owner, asDate(capability.startDate), asDate(capability.dueDate), capability.nextGate, capability.blocker,
      capability.description, capability.milestoneNames.join("; ") || "Project-wide",
    ]);
  }
  sheet.addRows(rows);
  const lastRow = sheet.rowCount;
  styleDataRange(sheet, 5, lastRow, headers.length);
  setDateColumn(sheet, [14, 15], 5, lastRow);
  for (let row = 5; row <= lastRow; row += 1) sheet.getCell(row, 10).numFmt = "0%";
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: lastRow, column: headers.length } };
  sheet.columns.forEach((column, index) => {
    column.width = [23, 28, 15, 14, 30, 21, 18, 22, 15, 11, 20, 12, 22, 14, 14, 25, 30, 42, 36][index];
  });
  addPageBreaks(sheet, 5, lastRow);
  sheet.pageSetup.printTitlesRow = "1:4";
  sheet.pageSetup.printArea = `A1:S${lastRow}`;
}

function addWorkstreamReview(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Workstream Review", { properties: { tabColor: { argb: COLORS.green } } });
  configureSheet(sheet);
  const headers = ["Workstream", "Relationship", "Package Code", "Package Name", "Package Type", "Business Milestones", "Status", "Progress", "Delivery Stage", "Risk", "Owner", "Due Date", "Blocker"];
  addTitle(sheet, "Project Workstream Review", "One row per item–workstream relationship. Primary and Supporting assignments remain explicit; global totals use canonical item keys.", headers.length);
  sheet.getRow(4).values = headers;
  styleHeader(sheet.getRow(4));
  const rows = dataset.workstreams.flatMap((workstream) =>
    workstream.items.map((item) => [
      workstream.name, item.assignment, item.code, item.name, item.kind, item.milestoneNames.join("; ") || "Project-wide",
      enumLabel(item.status), item.progress / 100, enumLabel(item.deliveryStage), enumLabel(item.riskLevel), item.owner,
      asDate(item.dueDate), item.blocker,
    ]),
  );
  sheet.addRows(rows);
  const lastRow = sheet.rowCount;
  styleDataRange(sheet, 5, lastRow, headers.length);
  setDateColumn(sheet, [12], 5, lastRow);
  for (let row = 5; row <= lastRow; row += 1) sheet.getCell(row, 8).numFmt = "0%";
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: lastRow, column: headers.length } };
  sheet.columns.forEach((column, index) => {
    column.width = [16, 15, 14, 30, 21, 34, 15, 11, 20, 12, 22, 14, 34][index];
  });
  addPageBreaks(sheet, 5, lastRow);
  sheet.pageSetup.printTitlesRow = "1:4";
  sheet.pageSetup.printArea = `A1:M${lastRow}`;
}

function addRisksAndDecisions(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Risks & Decisions", { properties: { tabColor: { argb: COLORS.red } } });
  configureSheet(sheet);
  addTitle(sheet, "Risks & Decisions", "Material risk ownership and the decisions management must make.", 13);
  sectionRow(sheet, 4, "Risks", 13);
  const riskHeader = 5;
  sheet.getRow(riskHeader).values = ["Risk", "Description", "Milestone", "Related Package", "Primary Workstream", "Probability", "Impact", "Severity", "Owner", "Mitigation", "Due Date", "Status", "Record ID"];
  styleHeader(sheet.getRow(riskHeader));
  for (const risk of dataset.risks) {
    sheet.addRow([risk.title, risk.description, risk.milestone, risk.relatedPackage, risk.primaryWorkstream, risk.probability, risk.impact, enumLabel(risk.severity), risk.owner, risk.mitigation, asDate(risk.dueDate), enumLabel(risk.status), risk.id]);
  }
  const riskEnd = sheet.rowCount;
  if (riskEnd >= 6) {
    styleDataRange(sheet, 6, riskEnd, 13);
    setDateColumn(sheet, [11], 6, riskEnd);
  }
  const decisionSection = sheet.rowCount + 2;
  sectionRow(sheet, decisionSection, "Management Decisions", 13);
  const decisionHeader = decisionSection + 1;
  sheet.getRow(decisionHeader).values = ["Decision", "Description", "Milestone", "Affected Workstreams", "Required By", "Recommended Direction", "Owner", "Status", "Decision", "Decided At", "Record ID"];
  styleHeader(sheet.getRow(decisionHeader));
  for (const decision of dataset.decisions) {
    sheet.addRow([decision.title, decision.description, decision.milestone, decision.affectedWorkstreams.join(", ") || "Not assigned", asDate(decision.requiredBy), decision.recommendedDirection, decision.owner, enumLabel(decision.status), decision.decisionText, asDate(decision.decidedAt), decision.id]);
  }
  const lastRow = sheet.rowCount;
  if (lastRow > decisionHeader) {
    styleDataRange(sheet, decisionHeader + 1, lastRow, 11);
    setDateColumn(sheet, [5, 10], decisionHeader + 1, lastRow);
  }
  sheet.columns.forEach((column, index) => {
    column.width = [28, 38, 28, 26, 20, 13, 12, 13, 22, 40, 14, 14, 18][index];
  });
  addPageBreaks(sheet, 6, lastRow);
  sheet.pageSetup.printTitlesRow = "1:5";
  sheet.pageSetup.printArea = `A1:M${lastRow}`;
}

function addPilotReview(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Pilot Scope Review", { properties: { tabColor: { argb: COLORS.orange } } });
  configureSheet(sheet);
  addTitle(sheet, "Controlled Pilot Scope Review", "Pilot teams, capabilities, criteria, limitations, issues and approvals at the snapshot time.", 9);
  if (!dataset.pilot) {
    sectionRow(sheet, 4, "Pilot workspace not configured", 9);
    sheet.getCell(5, 1).value = "No Controlled Pilot record was available at generation time.";
    sheet.pageSetup.printArea = "A1:I6";
    return;
  }
  const pilot = dataset.pilot;
  sectionRow(sheet, 4, "Overview and sign-off", 9);
  sheet.getRow(5).values = ["Pilot", pilot.name, "Support Owner", pilot.supportOwner, "Rollback Owner", pilot.rollbackOwner, "Business Sign-off", enumLabel(pilot.businessSignOffStatus), ""];
  sheet.getRow(6).values = ["Technical Sign-off", enumLabel(pilot.technicalSignOffStatus), "Final Decision", enumLabel(pilot.finalDecisionStatus), "Decision", pilot.finalDecision, "Known Limitations", pilot.knownLimitations, ""];
  styleDataRange(sheet, 5, 6, 9);
  let row = 8;
  sectionRow(sheet, row, "Pilot teams and users", 9);
  row += 1;
  sheet.getRow(row).values = ["Team", "Lead", "Pilot Users"];
  styleHeader(sheet.getRow(row));
  for (const team of pilot.teams) sheet.addRow([team.name, team.lead, team.users.join(", ") || "No users assigned"]);
  if (pilot.teams.length) styleDataRange(sheet, row + 1, sheet.rowCount, 3);
  row = sheet.rowCount + 2;
  sectionRow(sheet, row, "Included and deferred capabilities", 9);
  row += 1;
  sheet.getRow(row).values = ["Disposition", "Capability Code", "Capability", "Notes"];
  styleHeader(sheet.getRow(row));
  for (const capability of pilot.capabilities) sheet.addRow([capability.disposition === "INCLUDED" ? "Included in Pilot" : "Deferred after Pilot", capability.code, capability.name, capability.notes]);
  if (pilot.capabilities.length) styleDataRange(sheet, row + 1, sheet.rowCount, 4);
  row = sheet.rowCount + 2;
  sectionRow(sheet, row, "Entry and exit criteria", 9);
  row += 1;
  sheet.getRow(row).values = ["Gate", "Code", "Criterion", "Required", "Status", "Evidence"];
  styleHeader(sheet.getRow(row));
  for (const criterion of pilot.criteria) sheet.addRow([enumLabel(criterion.type), criterion.code, criterion.title, criterion.isRequired ? "Yes" : "No", enumLabel(criterion.status), criterion.evidence || "Not recorded"]);
  if (pilot.criteria.length) styleDataRange(sheet, row + 1, sheet.rowCount, 6);
  row = sheet.rowCount + 2;
  sectionRow(sheet, row, "Pilot issue log", 9);
  row += 1;
  sheet.getRow(row).values = ["Issue", "Severity", "Status", "Blocking", "Owner", "Due Date", "Mitigation"];
  styleHeader(sheet.getRow(row));
  const issueStart = row + 1;
  for (const issue of pilot.issues) sheet.addRow([issue.title, enumLabel(issue.severity), enumLabel(issue.status), issue.isBlocking ? "Yes" : "No", issue.owner, asDate(issue.dueDate), issue.mitigation]);
  if (pilot.issues.length) {
    styleDataRange(sheet, issueStart, sheet.rowCount, 7);
    setDateColumn(sheet, [6], issueStart, sheet.rowCount);
  }
  sheet.columns.forEach((column, index) => { column.width = [26, 22, 32, 18, 18, 20, 34, 40, 8][index]; });
  addPageBreaks(sheet, 5, sheet.rowCount);
  sheet.pageSetup.printArea = `A1:I${sheet.rowCount}`;
}

function addFeedbackAndSignoff(workbook: ExcelJS.Workbook, dataset: ReportDataset) {
  const sheet = workbook.addWorksheet("Final Feedback and Sign-off", { properties: { tabColor: { argb: COLORS.navy2 } } });
  configureSheet(sheet, false);
  addTitle(sheet, "Final Feedback and Sign-off", "Complete this sheet during the management review. Editable fields are shaded pale blue.", 8);
  sectionRow(sheet, 4, "Snapshot reference", 8);
  sheet.getRow(5).values = ["Project", dataset.project.name, "Project Code", dataset.project.code, "Generated", new Date(dataset.generatedAt), "Canonical Packages", dataset.metrics.canonicalPackages];
  setDateColumn(sheet, [6], 5, 5);
  styleDataRange(sheet, 5, 5, 8);
  sectionRow(sheet, 7, "Management feedback", 8);
  const prompts = [
    "Executive feedback",
    "Conditions before the next gate",
    "Accepted risks",
    "Decisions confirmed",
    "Actions and owners",
  ];
  let row = 8;
  for (const prompt of prompts) {
    sheet.mergeCells(row, 1, row, 2);
    sheet.getCell(row, 1).value = prompt;
    sheet.getCell(row, 1).font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORS.navy } };
    sheet.mergeCells(row, 3, row + 1, 8);
    const editable = sheet.getCell(row, 3);
    editable.value = "";
    editable.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FF" } };
    editable.border = { bottom: { style: "thin", color: { argb: COLORS.blue } } };
    editable.alignment = { wrapText: true, vertical: "top" };
    sheet.getRow(row).height = 28;
    sheet.getRow(row + 1).height = 28;
    row += 3;
  }
  sectionRow(sheet, row, "Final sign-off", 8);
  const signoffHeader = row + 1;
  sheet.getRow(signoffHeader).values = ["Role", "Name", "Decision", "Date", "Signature / Reference", "Comments"];
  styleHeader(sheet.getRow(signoffHeader));
  const signoffRows = ["Business Owner", "Technical Owner", "Project Manager", "Reviewer"];
  for (const role of signoffRows) {
    const added = sheet.addRow([role, "", "Pending", null, "", ""]);
    added.height = 34;
    for (let column = 2; column <= 6; column += 1) {
      added.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FF" } };
    }
    added.getCell(3).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Pending,Approved,Approved with Conditions,Rejected,Deferred"'],
      showErrorMessage: true,
      errorTitle: "Select a decision",
      error: "Choose a value from the list.",
    };
    added.getCell(4).numFmt = "dd mmm yyyy";
  }
  styleDataRange(sheet, signoffHeader + 1, sheet.rowCount, 6);
  sheet.columns.forEach((column, index) => { column.width = [24, 24, 28, 16, 28, 42, 12, 12][index]; });
  sheet.pageSetup.printArea = `A1:H${sheet.rowCount}`;
}

export async function generateExcelReport(dataset: ReportDataset) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Orbit Project Manager";
  workbook.lastModifiedBy = "Orbit Project Manager";
  workbook.created = new Date(dataset.generatedAt);
  workbook.modified = new Date(dataset.generatedAt);
  workbook.subject = "Management Review Pack";
  workbook.title = `${dataset.project.name} — Management Review Pack`;
  workbook.company = "Orbit Project Manager";
  workbook.calcProperties.fullCalcOnLoad = true;

  addExecutiveSummary(workbook, dataset);
  addMilestoneReview(workbook, dataset);
  addWorkstreamReview(workbook, dataset);
  addRisksAndDecisions(workbook, dataset);
  addPilotReview(workbook, dataset);
  addFeedbackAndSignoff(workbook, dataset);

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.from(result as ArrayBuffer);
}


