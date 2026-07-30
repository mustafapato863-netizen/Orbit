import PptxGenJS from "pptxgenjs";

import { PIPELINE_STAGES } from "@/lib/pipeline/pipeline";
import type { ReportDataset, ReportPackage } from "@/lib/reports/report.dataset";

const COLORS = {
  navy: "0B1220",
  navy2: "14213D",
  blue: "2563EB",
  green: "059669",
  orange: "EA580C",
  purple: "7C3AED",
  red: "DC2626",
  amber: "D97706",
  white: "FFFFFF",
  ink: "172033",
  muted: "64748B",
  pale: "F4F7FB",
  border: "D9E2EF",
};

const STAGE_COLORS: Record<string, string> = {
  NOT_STARTED: "94A3B8",
  IN_DEVELOPMENT: COLORS.blue,
  TECHNICAL_VERIFICATION: "0891B2",
  BUSINESS_UAT: COLORS.purple,
  STAGING: COLORS.orange,
  CONTROLLED_PILOT: COLORS.amber,
  PRODUCTION: COLORS.green,
};

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function date(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function addChrome(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  title: string,
  section: string,
) {
  slide.background = { color: COLORS.pale };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.16,
    line: { color: COLORS.blue, transparency: 100 },
    fill: { color: COLORS.blue },
  });
  slide.addText(section.toUpperCase(), {
    x: 0.55,
    y: 0.35,
    w: 4.8,
    h: 0.25,
    fontFace: "Aptos",
    fontSize: 10,
    bold: true,
    color: COLORS.blue,
    charSpacing: 1.4,
    margin: 0,
  });
  slide.addText(title, {
    x: 0.55,
    y: 0.68,
    w: 12.15,
    h: 0.55,
    fontFace: "Aptos Display",
    fontSize: 25,
    bold: true,
    color: COLORS.navy,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  });
  slide.addText("Orbit Project Manager", {
    x: 0.55,
    y: 7.15,
    w: 3.8,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 8,
    color: COLORS.muted,
    margin: 0,
  });
  slide.addText(String((pptx as unknown as { _slides: unknown[] })._slides.length), {
    x: 12.2,
    y: 7.13,
    w: 0.55,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 8,
    color: COLORS.muted,
    align: "right",
    margin: 0,
  });
}

function addMetric(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  labelText: string,
  value: string | number,
  color = COLORS.blue,
) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 1.05,
    rectRadius: 0.06,
    line: { color: COLORS.border, pt: 0.8 },
    fill: { color: COLORS.white },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.07,
    h: 1.05,
    line: { color, transparency: 100 },
    fill: { color },
  });
  slide.addText(String(value), {
    x: x + 0.2,
    y: y + 0.14,
    w: w - 0.35,
    h: 0.42,
    fontFace: "Aptos Display",
    fontSize: 22,
    bold: true,
    color: COLORS.ink,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(labelText, {
    x: x + 0.2,
    y: y + 0.65,
    w: w - 0.35,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 9.5,
    color: COLORS.muted,
    margin: 0,
    fit: "shrink",
  });
}

type SimpleTableCell = string | number;
type ReportTableRow = PptxGenJS.TableRow | SimpleTableCell[];

function normalizeRow(values: ReportTableRow): PptxGenJS.TableRow {
  return values.map((value) =>
    typeof value === "object" && value !== null && "text" in value
      ? value
      : { text: String(value), options: {} },
  ) as PptxGenJS.TableRow;
}
function addTable(
  slide: PptxGenJS.Slide,
  rows: ReportTableRow[],
  options: { y?: number; colW?: number[]; fontSize?: number } = {},
) {
  slide.addTable(rows.map(normalizeRow), {
    x: 0.55,
    y: options.y ?? 1.45,
    w: 12.23,
    colW: options.colW,
    border: { type: "solid", color: COLORS.border, pt: 0.6 },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    fontFace: "Aptos",
    fontSize: options.fontSize ?? 11,
    margin: [0.08, 0.1, 0.08, 0.1],
    valign: "middle",
    rowH: 0.47,
    bold: false,
    breakLine: false,
  });
}

function headerRow(labels: string[]): PptxGenJS.TableRow {
  return labels.map((text) => ({
    text,
    options: {
      bold: true,
      color: COLORS.white,
      fill: { color: COLORS.navy2 },
      valign: "middle",
      margin: [0.08, 0.1, 0.08, 0.1],
    },
  }));
}

function packageRows(items: ReportPackage[]): ReportTableRow[] {
  return items.map((item) => [
    `${item.code}\n${item.name}`,
    item.kind,
    item.primaryWorkstream,
    item.supportingWorkstreams.length ? item.supportingWorkstreams.join(", ") : "None",
    label(item.deliveryStage),
    `${item.progress}%`,
    item.owner,
    date(item.dueDate),
  ]);
}

export async function generatePowerPointReport(dataset: ReportDataset) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Orbit Project Manager";
  pptx.company = "Orbit Project Manager";
  pptx.subject = "Project management review";
  pptx.title = `${dataset.project.name} — Management Report`;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
  };
  pptx.defineLayout({ name: "ORBIT_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "ORBIT_WIDE";

  const executive = pptx.addSlide();
  executive.background = { color: COLORS.navy };
  executive.addText(dataset.project.code, {
    x: 0.75, y: 0.65, w: 4.5, h: 0.3, fontSize: 12, bold: true,
    color: "7DB2FF", charSpacing: 1.6, margin: 0,
  });
  executive.addText(dataset.project.name, {
    x: 0.75, y: 1.15, w: 11.8, h: 0.9, fontFace: "Aptos Display",
    fontSize: 34, bold: true, color: COLORS.white, margin: 0, fit: "shrink",
  });
  executive.addText("Management review and release recommendation", {
    x: 0.75, y: 2.15, w: 9, h: 0.4, fontSize: 18, color: "CBD5E1", margin: 0,
  });
  const executiveMetrics = [
    ["Derived planning progress", `${dataset.project.derivedPlanningProgress}%`, COLORS.blue],
    ["Canonical work packages", dataset.metrics.canonicalPackages, COLORS.purple],
    ["High risk", dataset.metrics.highRisk, COLORS.amber],
    ["Blocked", dataset.metrics.blocked, COLORS.red],
  ] as const;
  executiveMetrics.forEach(([metric, value, color], index) =>
    addMetric(pptx, executive, 0.75 + index * 3.05, 3.15, 2.72, metric, value, color),
  );
  executive.addText(dataset.releaseRecommendation, {
    x: 0.75, y: 4.65, w: 11.8, h: 0.82, fontSize: 17, bold: true,
    color: COLORS.white, margin: 0.08, fit: "shrink",
  });
  executive.addText(
    `Project window: ${date(dataset.project.startDate)} — ${date(dataset.project.targetDate)}  |  Generated ${date(dataset.generatedAt)}`,
    { x: 0.75, y: 6.55, w: 11.8, h: 0.25, fontSize: 10, color: "94A3B8", margin: 0 },
  );

  const how = pptx.addSlide();
  addChrome(pptx, how, "Read counts once, then follow relationships", "How to read this report");
  const principles = [
    ["Canonical package", "Every Milestone-Specific Work Item plus every Shared Capability, counted once globally."],
    ["Primary workstream", "The single accountable workstream for an item."],
    ["Supporting workstream", "A contributing workstream; shown as a relationship, never added to the global package total."],
    ["Derived planning progress", "A simple average of package planning progress; it is not earned value."],
    ["Owner labels", `Missing ownership is shown explicitly as “Owner Not Assigned”.`],
    ["Coverage", `${dataset.metrics.workItems} Work Items and ${dataset.metrics.sharedCapabilities} canonical Shared Capabilities are included.`],
  ];
  principles.forEach(([heading, body], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    how.addShape(pptx.ShapeType.roundRect, {
      x: 0.65 + col * 6.15, y: 1.45 + row * 1.65, w: 5.75, h: 1.3,
      rectRadius: 0.05, line: { color: COLORS.border }, fill: { color: COLORS.white },
    });
    how.addText(heading, {
      x: 0.9 + col * 6.15, y: 1.66 + row * 1.65, w: 5.2, h: 0.3,
      fontSize: 14, bold: true, color: COLORS.navy, margin: 0,
    });
    how.addText(body, {
      x: 0.9 + col * 6.15, y: 2.05 + row * 1.65, w: 5.15, h: 0.5,
      fontSize: 10.5, color: COLORS.muted, margin: 0, fit: "shrink",
    });
  });

  for (const milestone of dataset.milestones) {
    const pages = chunks(milestone.workItems, 5);
    const milestonePages = pages.length ? pages : [[]];
    milestonePages.forEach((items, index) => {
      const slide = pptx.addSlide();
      addChrome(
        pptx,
        slide,
        `${milestone.code} · ${milestone.name}${index ? ` (continued ${index + 1}/${milestonePages.length})` : ""}`,
        "Business Milestone roadmap",
      );
      if (index === 0) {
        addMetric(pptx, slide, 0.55, 1.35, 2.15, "Progress", `${milestone.progress}%`, COLORS.blue);
        addMetric(pptx, slide, 2.86, 1.35, 2.15, "Risk", label(milestone.riskLevel), milestone.riskLevel === "HIGH" || milestone.riskLevel === "CRITICAL" ? COLORS.red : COLORS.amber);
        addMetric(pptx, slide, 5.17, 1.35, 2.15, "Current stage", label(milestone.deliveryStage), STAGE_COLORS[milestone.deliveryStage]);
        addMetric(pptx, slide, 7.48, 1.35, 2.15, "Specific work", milestone.workItems.length, COLORS.purple);
        addMetric(pptx, slide, 9.79, 1.35, 2.44, "Shared dependencies", milestone.sharedDependencies.length, COLORS.orange);
        slide.addText(milestone.businessPurpose, {
          x: 0.65, y: 2.62, w: 12.0, h: 0.45, fontSize: 11, color: COLORS.muted, margin: 0, fit: "shrink",
        });
      }
      const tableY = index === 0 ? 3.28 : 1.45;
      const rows: ReportTableRow[] = [
        headerRow(["Specific Work Item", "Primary", "Supporting", "Stage", "Progress", "Owner", "Due"]),
        ...items.map((item) => [
          `${item.code}\n${item.name}`,
          item.primaryWorkstream,
          item.supportingWorkstreams.join(", ") || "None",
          label(item.deliveryStage),
          `${item.progress}%`,
          item.owner,
          date(item.dueDate),
        ]),
      ];
      if (!items.length) rows.push(["No Milestone-Specific Work Items", "—", "—", "—", "—", "—", "—"]);
      addTable(slide, rows, { y: tableY, colW: [3.2, 1.25, 1.4, 1.7, 0.8, 1.75, 1.25], fontSize: 10.5 });
      if (index === 0 && milestone.sharedDependencies.length) {
        slide.addText(
          `Canonical dependencies (references only): ${milestone.sharedDependencies.map(({ code, name }) => `${code} ${name}`).join(" · ")}`,
          { x: 0.65, y: 6.64, w: 12, h: 0.28, fontSize: 10.5, color: COLORS.muted, margin: 0, fit: "shrink" },
        );
      }
    });
  }

  for (const workstream of dataset.workstreams) {
    const pages = chunks(workstream.items, 6);
    (pages.length ? pages : [[]]).forEach((items, index, all) => {
      const slide = pptx.addSlide();
      addChrome(
        pptx,
        slide,
        `${workstream.name} ownership${all.length > 1 ? ` (${index + 1}/${all.length})` : ""}`,
        "Project Workstream breakdown",
      );
      if (index === 0) {
        addMetric(pptx, slide, 0.55, 1.35, 2.25, "Unique related", workstream.uniqueCount, COLORS.blue);
        addMetric(pptx, slide, 2.98, 1.35, 2.25, "Primary", workstream.primaryCount, COLORS.navy2);
        addMetric(pptx, slide, 5.41, 1.35, 2.25, "Supporting", workstream.supportingCount, COLORS.purple);
        addMetric(pptx, slide, 7.84, 1.35, 2.25, "Average progress", `${workstream.averageProgress}%`, COLORS.green);
      }
      addTable(slide, [
        headerRow(["Package", "Type", "Relationship", "Stage", "Progress", "Milestones", "Owner"]),
        ...items.map((item) => [
          `${item.code}\n${item.name}`,
          item.kind,
          item.assignment,
          label(item.deliveryStage),
          `${item.progress}%`,
          item.milestoneNames.join(", ") || "Project-wide",
          item.owner,
        ]),
      ], { y: index === 0 ? 2.72 : 1.45, colW: [2.8, 1.35, 1.2, 1.55, 0.75, 2.7, 1.75], fontSize: 10.5 });
    });
  }

  chunks(dataset.canonicalPackages, 6).forEach((items, index, all) => {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, `Every canonical package is visible (${index + 1}/${all.length})`, "Delivery Pipeline");
    addTable(slide, [
      headerRow(["Package", "Type", "Primary", "Supporting", "Stage", "Progress", "Owner", "Due"]),
      ...packageRows(items),
    ], { colW: [2.55, 1.25, 1.2, 1.35, 1.55, 0.7, 1.65, 1.2], fontSize: 10.5 });
  });

  const stageSlide = pptx.addSlide();
  addChrome(pptx, stageSlide, "The portfolio’s delivery-stage distribution", "Delivery Pipeline");
  PIPELINE_STAGES.forEach((stage, index) => {
    const x = 0.65 + index * 1.74;
    stageSlide.addShape(pptx.ShapeType.roundRect, {
      x, y: 2.15, w: 1.48, h: 2.45, rectRadius: 0.05,
      line: { color: STAGE_COLORS[stage], pt: 1.2 }, fill: { color: COLORS.white },
    });
    stageSlide.addText(String(dataset.metrics.stageCounts[stage]), {
      x: x + 0.1, y: 2.46, w: 1.28, h: 0.65, align: "center",
      fontSize: 30, bold: true, color: STAGE_COLORS[stage], margin: 0,
    });
    stageSlide.addText(dataset.metrics.stageLabels[stage], {
      x: x + 0.12, y: 3.45, w: 1.24, h: 0.58, align: "center",
      fontSize: 10, bold: true, color: COLORS.ink, margin: 0, fit: "shrink",
    });
    if (index < PIPELINE_STAGES.length - 1) {
      stageSlide.addShape(pptx.ShapeType.chevron, {
        x: x + 1.46, y: 3.04, w: 0.3, h: 0.42,
        line: { color: COLORS.border, transparency: 100 }, fill: { color: COLORS.border },
      });
    }
  });

  const pilotItems = dataset.pilot
    ? [
        ...dataset.pilot.teams.map((item) => ({ category: "Pilot team", name: item.name, detail: `${item.users.length} users · Lead: ${item.lead}` })),
        ...dataset.pilot.capabilities.map((item) => ({ category: item.disposition === "INCLUDED" ? "Included in Pilot" : "Deferred after Pilot", name: item.name, detail: item.notes })),
        ...dataset.pilot.criteria.map((item) => ({ category: `${label(item.type)} criterion`, name: item.title, detail: `${label(item.status)}${item.isRequired ? " · Required" : " · Optional"}` })),
      ]
    : [];
  const pilotPages = chunks(pilotItems, 6);
  (pilotPages.length ? pilotPages : [[]]).forEach((items, index, all) => {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, `Controlled Pilot scope${all.length > 1 ? ` (${index + 1}/${all.length})` : ""}`, "Controlled Pilot");
    if (!dataset.pilot) {
      slide.addText("The Controlled Pilot workspace is not configured.", { x: 0.75, y: 2.5, w: 11.8, h: 0.6, fontSize: 22, color: COLORS.muted, align: "center" });
      return;
    }
    if (index === 0) {
      addMetric(pptx, slide, 0.55, 1.35, 2.3, "Business sign-off", label(dataset.pilot.businessSignOffStatus), COLORS.blue);
      addMetric(pptx, slide, 3.02, 1.35, 2.3, "Technical sign-off", label(dataset.pilot.technicalSignOffStatus), COLORS.green);
      addMetric(pptx, slide, 5.49, 1.35, 2.3, "Final decision", label(dataset.pilot.finalDecisionStatus), COLORS.purple);
      addMetric(pptx, slide, 7.96, 1.35, 2.3, "Open issues", dataset.pilot.issues.filter(({ status }) => !["RESOLVED", "CLOSED"].includes(status)).length, COLORS.amber);
    }
    addTable(slide, [headerRow(["Scope area", "Item", "Position / evidence"]), ...items.map((item) => [item.category, item.name, item.detail])], { y: index === 0 ? 2.75 : 1.45, colW: [2.05, 3.45, 6.73], fontSize: 10.5 });
  });

  const riskRows = dataset.risks.map((risk) => ({
    title: risk.title,
    context: `${risk.milestone} · ${risk.relatedPackage}`,
    severity: label(risk.severity),
    status: label(risk.status),
    owner: risk.owner,
    mitigation: risk.mitigation,
    due: date(risk.dueDate),
  }));
  chunks(riskRows, 5).forEach((items, index, all) => {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, `Material risks and blockers${all.length > 1 ? ` (${index + 1}/${all.length})` : ""}`, "Risks and blockers");
    addTable(slide, [
      headerRow(["Risk", "Context", "Severity", "Status", "Owner", "Mitigation", "Due"]),
      ...items.map((item) => [item.title, item.context, item.severity, item.status, item.owner, item.mitigation, item.due]),
    ], { colW: [2.0, 2.0, 0.85, 0.9, 1.35, 3.75, 1.1], fontSize: 10.5 });
  });
  if (!riskRows.length) {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, "No active risks are recorded", "Risks and blockers");
    slide.addText("No Risk records were available at generation time.", { x: 0.75, y: 2.5, w: 11.8, h: 0.6, fontSize: 22, color: COLORS.muted, align: "center" });
  }

  const decisionPages = chunks(dataset.decisions, 4);
  (decisionPages.length ? decisionPages : [[]]).forEach((items, index, all) => {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, `Management decisions${all.length > 1 ? ` (${index + 1}/${all.length})` : ""}`, "Management decisions");
    if (!items.length) {
      slide.addText("No management decisions are recorded.", { x: 0.75, y: 2.5, w: 11.8, h: 0.6, fontSize: 22, color: COLORS.muted, align: "center" });
      return;
    }
    addTable(slide, [
      headerRow(["Decision", "Milestone", "Workstreams", "Required by", "Owner", "Status", "Recommended direction"]),
      ...items.map((item) => [item.title, item.milestone, item.affectedWorkstreams.join(", ") || "Not assigned", date(item.requiredBy), item.owner, label(item.status), item.recommendedDirection]),
    ], { colW: [2.0, 1.8, 1.55, 1.15, 1.3, 0.9, 3.53], fontSize: 10.5 });
  });

  const upcomingPages = chunks(dataset.upcoming, 6);
  (upcomingPages.length ? upcomingPages : [[]]).forEach((items, index, all) => {
    const slide = pptx.addSlide();
    addChrome(pptx, slide, `Upcoming delivery commitments${all.length > 1 ? ` (${index + 1}/${all.length})` : ""}`, "Upcoming delivery");
    if (!items.length) {
      slide.addText("No active package due dates are recorded.", { x: 0.75, y: 2.5, w: 11.8, h: 0.6, fontSize: 22, color: COLORS.muted, align: "center" });
      return;
    }
    addTable(slide, [
      headerRow(["Due", "Package", "Type", "Stage", "Progress", "Primary", "Owner", "Risk"]),
      ...items.map((item) => [date(item.dueDate), `${item.code}\n${item.name}`, item.kind, label(item.deliveryStage), `${item.progress}%`, item.primaryWorkstream, item.owner, label(item.riskLevel)]),
    ], { colW: [1.2, 3.0, 1.25, 1.6, 0.8, 1.25, 1.7, 0.85], fontSize: 10.5 });
  });

  const recommendation = pptx.addSlide();
  recommendation.background = { color: COLORS.navy };
  recommendation.addText("FINAL RELEASE RECOMMENDATION", {
    x: 0.75, y: 0.78, w: 6.6, h: 0.28, fontSize: 11, bold: true,
    color: "7DB2FF", charSpacing: 1.6, margin: 0,
  });
  recommendation.addText(dataset.releaseRecommendation, {
    x: 0.75, y: 1.35, w: 11.8, h: 1.3, fontSize: 28, bold: true,
    fontFace: "Aptos Display", color: COLORS.white, margin: 0, fit: "shrink",
  });
  const conditions = [
    `${dataset.metrics.blocked} blocked canonical package(s)`,
    `${dataset.metrics.highRisk} high/critical-risk canonical package(s)`,
    `${dataset.metrics.productionCount} package(s) in Production`,
    dataset.pilot ? `Pilot decision: ${label(dataset.pilot.finalDecisionStatus)}` : "Pilot workspace: Not configured",
  ];
  conditions.forEach((condition, index) => {
    recommendation.addShape(pptx.ShapeType.roundRect, {
      x: 0.75 + (index % 2) * 6.05, y: 3.25 + Math.floor(index / 2) * 1.1,
      w: 5.65, h: 0.78, rectRadius: 0.04,
      line: { color: "334155" }, fill: { color: COLORS.navy2 },
    });
    recommendation.addText(condition, {
      x: 1.0 + (index % 2) * 6.05, y: 3.47 + Math.floor(index / 2) * 1.1,
      w: 5.15, h: 0.25, fontSize: 13, color: COLORS.white, margin: 0, fit: "shrink",
    });
  });
  recommendation.addText("Decision owners should confirm the stated release conditions against the latest snapshot before authorizing the next gate.", {
    x: 0.75, y: 6.05, w: 11.8, h: 0.55, fontSize: 13, color: "CBD5E1", margin: 0,
  });

  const result = await pptx.write({ outputType: "nodebuffer", compression: true });
  return Buffer.isBuffer(result) ? result : Buffer.from(result as ArrayBuffer);
}





