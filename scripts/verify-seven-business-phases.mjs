import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env", quiet: true });

const expected = [
  ["BPH-01", "Business Delivery — Operational Scope, KPI Governance & Team Onboarding", 100, "2026-06-01", "2026-06-20", 7],
  ["BPH-02", "Business Delivery — Employee Performance", 94, "2026-06-15", "2026-07-24", 5],
  ["BPH-03", "Business Delivery — Team & Department Performance", 90, "2026-06-25", "2026-08-07", 8],
  ["BPH-04", "Business Delivery — Managerial, Corporate & Strategic Performance", 41, "2026-07-27", "2026-08-31", 5],
  ["BPH-05", "Business Delivery — Performance Insights & Classification", 43, "2026-08-10", "2026-09-03", 3],
  ["BPH-06", "Business Delivery — Planning, Corrective Actions & Follow-up", 28, "2026-08-24", "2026-09-18", 2],
  ["BPH-07", "Business Delivery — Reporting, Management Review & Business Adoption", 40, "2026-09-07", "2026-09-30", 5],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const project = (
    await client.query(
      `SELECT "id" FROM "Project"
       WHERE "code" = 'PMS' AND "archivedAt" IS NULL`,
    )
  ).rows[0];
  assert(project, "Active PMS project was not found.");

  const rows = (
    await client.query(
      `SELECT m."code", m."name", m."progress",
              to_char(m."startDate", 'YYYY-MM-DD') AS "startDate",
              to_char(m."dueDate", 'YYYY-MM-DD') AS "dueDate",
              count(w."id")::int AS "itemCount"
       FROM "Milestone" m
       LEFT JOIN "WorkItem" w
         ON w."milestoneId" = m."id" AND w."archivedAt" IS NULL
       WHERE m."projectId" = $1
         AND m."code" LIKE 'BPH-%'
         AND m."archivedAt" IS NULL
       GROUP BY m."id"
       ORDER BY m."sortOrder"`,
      [project.id],
    )
  ).rows;
  assert(rows.length === 7, `Expected 7 Business phases; found ${rows.length}.`);

  for (const [code, name, progress, startDate, dueDate, itemCount] of expected) {
    const row = rows.find((candidate) => candidate.code === code);
    assert(row, `Missing ${code}.`);
    assert(row.name === name, `${code} name mismatch.`);
    assert(row.progress === progress, `${code} progress mismatch.`);
    assert(
      row.startDate === startDate && row.dueDate === dueDate,
      `${code} date envelope mismatch.`,
    );
    assert(row.itemCount === itemCount, `${code} item count mismatch.`);
  }

  const additions = (
    await client.query(
      `SELECT w."name"
       FROM "WorkItem" w
       JOIN "Milestone" m ON m."id" = w."milestoneId"
       WHERE m."projectId" = $1
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
  assert(additions.length === 3, "User-added Business items were not preserved.");

  const riskLink = (
    await client.query(
      `SELECT m."code"
       FROM "Risk" r
       JOIN "Milestone" m ON m."id" = r."milestoneId"
       WHERE r."id" = $1`,
      ["80000000-0000-4000-8000-000000000003"],
    )
  ).rows[0];
  assert(riskLink?.code === "BPH-06", "Corrective-action risk link is stale.");

  console.log(
    JSON.stringify(
      {
        verified: true,
        businessPhases: rows,
        businessWorkItems: rows.reduce(
          (total, row) => total + row.itemCount,
          0,
        ),
        preservedUserAdditions: additions.map(({ name }) => name),
        correctiveActionRiskPhase: riskLink.code,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
