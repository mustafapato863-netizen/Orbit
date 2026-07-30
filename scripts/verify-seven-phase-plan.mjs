import { readFile } from "node:fs/promises";

import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env", quiet: true });

const roadmap = JSON.parse(
  await readFile("prisma/data/pms-dashboard-roadmap.json", "utf8"),
);
const expected = roadmap.phases.filter((phase) => /^PH-\d{2}$/.test(phase.code));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

await client.connect();
try {
  const project = (
    await client.query(
      `SELECT "id" FROM "Project"
       WHERE "code" = 'PMS' AND "archivedAt" IS NULL`,
    )
  ).rows[0];
  assert(project, "Active PMS project was not found.");

  const phases = (
    await client.query(
      `SELECT m."id", m."code", m."name", m."progress",
              to_char(m."startDate", 'YYYY-MM-DD') AS "startDate",
              to_char(m."dueDate", 'YYYY-MM-DD') AS "dueDate",
              count(w."id")::int AS "itemCount",
              count(w."id") FILTER (WHERE w."code" LIKE '%.GATE')::int AS "gateCount",
              round(avg(w."progress"))::int AS "calculatedProgress",
              to_char(min(w."startDate"), 'YYYY-MM-DD') AS "calculatedStart",
              to_char(max(w."dueDate"), 'YYYY-MM-DD') AS "calculatedEnd"
       FROM "Milestone" m
       LEFT JOIN "WorkItem" w
         ON w."milestoneId" = m."id" AND w."archivedAt" IS NULL
       WHERE m."projectId" = $1
         AND m."code" ~ '^PH-[0-9]{2}$'
         AND m."archivedAt" IS NULL
       GROUP BY m."id"
       ORDER BY m."sortOrder"`,
      [project.id],
    )
  ).rows;
  assert(phases.length === 7, `Expected 7 technical phases; found ${phases.length}.`);

  for (const expectedPhase of expected) {
    const stored = phases.find((phase) => phase.code === expectedPhase.code);
    assert(stored, `Missing ${expectedPhase.code}.`);
    assert(stored.name === expectedPhase.name, `${expectedPhase.code} name mismatch.`);
    assert(
      stored.progress === expectedPhase.progress,
      `${expectedPhase.code} progress mismatch.`,
    );
    assert(stored.gateCount === 1, `${expectedPhase.code} must have one gate.`);
  }

  const totals = (
    await client.query(
      `SELECT
         count(DISTINCT m."id")::int AS "milestones",
         count(w."id")::int AS "workItems",
         count(w."id") FILTER (WHERE m."code" ~ '^PH-[0-9]{2}$')::int AS "technicalItems",
         count(w."id") FILTER (WHERE m."code" ~ '^BPH-[0-9]{2}$')::int AS "businessItems"
       FROM "Milestone" m
       LEFT JOIN "WorkItem" w
         ON w."milestoneId" = m."id" AND w."archivedAt" IS NULL
       WHERE m."projectId" = $1 AND m."archivedAt" IS NULL`,
      [project.id],
    )
  ).rows[0];
  assert(totals.milestones === 14, `Expected 14 phases; found ${totals.milestones}.`);
  assert(totals.workItems === 106, `Expected 106 work items; found ${totals.workItems}.`);
  assert(totals.technicalItems === 71, "Technical work-item total mismatch.");
  assert(totals.businessItems === 35, "Business work-item total mismatch.");

  const preservedBusinessItems = (
    await client.query(
      `SELECT w."code", w."name"
       FROM "WorkItem" w
       JOIN "Milestone" m ON m."id" = w."milestoneId"
       WHERE m."projectId" = $1
         AND m."code" = 'BPH-03'
         AND w."archivedAt" IS NULL
         AND w."name" = ANY($2::text[])
       ORDER BY w."name"`,
      [
        project.id,
        [
          "Offshore Inbound & Outbound",
          "Offshore Pre-Approvals",
          "Offshore Digital Marketing",
        ],
      ],
    )
  ).rows;
  assert(
    preservedBusinessItems.length === 3,
    "User-added Business work items were not preserved.",
  );

  const governance = (
    await client.query(
      `SELECT
         (SELECT count(*)::int FROM "Risk" r
          JOIN "Milestone" m ON m."id" = r."milestoneId"
          WHERE r."id" = ANY($1::uuid[]) AND m."code" = ANY($2::text[])) AS "risks",
         (SELECT count(*)::int FROM "Decision" d
          JOIN "Milestone" m ON m."id" = d."milestoneId"
          WHERE d."id" = ANY($3::uuid[]) AND m."code" = ANY($4::text[])) AS "decisions"`,
      [
        [
          "80000000-0000-4000-8000-000000000001",
          "80000000-0000-4000-8000-000000000002",
        ],
        ["PH-03", "PH-05"],
        [
          "81000000-0000-4000-8000-000000000001",
          "81000000-0000-4000-8000-000000000002",
          "81000000-0000-4000-8000-000000000003",
        ],
        ["PH-03", "PH-05", "PH-07"],
      ],
    )
  ).rows[0];
  assert(governance.risks === 2, "Governance risk links are incomplete.");
  assert(governance.decisions === 3, "Governance decision links are incomplete.");

  console.log(
    JSON.stringify(
      {
        verified: true,
        technicalPhases: phases.map(
          ({ code, name, progress, startDate, dueDate, itemCount, gateCount }) => ({
            code,
            name,
            progress,
            startDate,
            dueDate,
            itemCount,
            gateCount,
          }),
        ),
        totals,
        preservedBusinessItems,
        governance,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
