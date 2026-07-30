import "dotenv/config";

import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";

const database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);

try {
  const mismatches = await database.$queryRaw<Array<{ count: number }>>`
    SELECT count(*)::int AS count
    FROM (
      SELECT wi.id
      FROM "WorkItem" wi
      JOIN "Milestone" m ON m.id = wi."milestoneId"
      JOIN "Workstream" w ON w.id = wi."primaryWorkstreamId"
      WHERE w."projectId" <> m."projectId"
      UNION ALL
      SELECT sc.id
      FROM "SharedCapability" sc
      JOIN "Workstream" w ON w.id = sc."primaryWorkstreamId"
      WHERE w."projectId" <> sc."projectId"
      UNION ALL
      SELECT r.id
      FROM "Risk" r
      JOIN "Workstream" w ON w.id = r."primaryWorkstreamId"
      WHERE w."projectId" <> r."projectId"
      UNION ALL
      SELECT dw."decisionId"
      FROM "DecisionWorkstream" dw
      JOIN "Decision" d ON d.id = dw."decisionId"
      JOIN "Workstream" w ON w.id = dw."workstreamId"
      WHERE w."projectId" <> d."projectId"
    ) invalid_relations
  `;
  const projectCount = await database.project.count();
  const workstreamCount = await database.workstream.count();
  const mismatchCount = mismatches[0]?.count ?? 0;

  if (mismatchCount !== 0) {
    throw new Error("Project-scoped Workstream verification failed.");
  }

  console.info(
    `Workstream migration verified (${projectCount} projects, ${workstreamCount} project-scoped workstreams, 0 cross-project references).`,
  );
} finally {
  await database.$disconnect();
}
