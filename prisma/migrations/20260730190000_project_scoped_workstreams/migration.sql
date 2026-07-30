-- Make the project classification descriptive and non-restrictive.
ALTER TABLE "Project"
ADD COLUMN "projectType" VARCHAR(40) NOT NULL DEFAULT 'CUSTOM';

-- Convert the legacy three-value enum to an extensible project-local code.
ALTER TABLE "Workstream"
ALTER COLUMN "code" TYPE VARCHAR(40)
USING "code"::text;

ALTER TABLE "Workstream"
ADD COLUMN "projectId" UUID,
ADD COLUMN "slug" VARCHAR(80),
ADD COLUMN "iconKey" VARCHAR(40) NOT NULL DEFAULT 'layers',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "Workstream_code_key";
DROP INDEX "Workstream_name_key";

-- Capture every project/legacy-workstream relationship before cloning.
CREATE TEMP TABLE "_WorkstreamProjectMap" AS
SELECT DISTINCT
  gen_random_uuid() AS "newId",
  relation."projectId",
  relation."workstreamId" AS "oldId"
FROM (
  SELECT m."projectId", wi."primaryWorkstreamId" AS "workstreamId"
  FROM "WorkItem" wi
  JOIN "Milestone" m ON m."id" = wi."milestoneId"
  UNION
  SELECT m."projectId", wiw."workstreamId"
  FROM "WorkItemWorkstream" wiw
  JOIN "WorkItem" wi ON wi."id" = wiw."workItemId"
  JOIN "Milestone" m ON m."id" = wi."milestoneId"
  UNION
  SELECT sc."projectId", sc."primaryWorkstreamId"
  FROM "SharedCapability" sc
  UNION
  SELECT sc."projectId", scw."workstreamId"
  FROM "SharedCapabilityWorkstream" scw
  JOIN "SharedCapability" sc ON sc."id" = scw."sharedCapabilityId"
  UNION
  SELECT r."projectId", r."primaryWorkstreamId"
  FROM "Risk" r
  WHERE r."primaryWorkstreamId" IS NOT NULL
  UNION
  SELECT d."projectId", dw."workstreamId"
  FROM "DecisionWorkstream" dw
  JOIN "Decision" d ON d."id" = dw."decisionId"
) relation;

INSERT INTO "Workstream" (
  "id", "projectId", "code", "slug", "name", "description",
  "colorToken", "iconKey", "sortOrder", "archivedAt", "createdAt", "updatedAt"
)
SELECT
  map."newId",
  map."projectId",
  legacy."code",
  lower(replace(legacy."code", '_', '-')),
  legacy."name",
  legacy."description",
  CASE legacy."code"
    WHEN 'FRONTEND' THEN '#2f73e8'
    WHEN 'BACKEND' THEN '#129b68'
    WHEN 'DATABASE' THEN '#e8860b'
    ELSE '#7157e8'
  END,
  CASE legacy."code"
    WHEN 'FRONTEND' THEN 'monitor'
    WHEN 'BACKEND' THEN 'server'
    WHEN 'DATABASE' THEN 'database'
    ELSE 'layers'
  END,
  CASE legacy."code"
    WHEN 'FRONTEND' THEN 10
    WHEN 'BACKEND' THEN 20
    WHEN 'DATABASE' THEN 30
    ELSE 100
  END,
  legacy."archivedAt",
  legacy."createdAt",
  legacy."updatedAt"
FROM "_WorkstreamProjectMap" map
JOIN "Workstream" legacy ON legacy."id" = map."oldId";

UPDATE "WorkItem" wi
SET "primaryWorkstreamId" = map."newId"
FROM "Milestone" m, "_WorkstreamProjectMap" map
WHERE m."id" = wi."milestoneId"
  AND map."projectId" = m."projectId"
  AND map."oldId" = wi."primaryWorkstreamId";

UPDATE "WorkItemWorkstream" wiw
SET "workstreamId" = map."newId"
FROM "WorkItem" wi, "Milestone" m, "_WorkstreamProjectMap" map
WHERE wi."id" = wiw."workItemId"
  AND m."id" = wi."milestoneId"
  AND map."projectId" = m."projectId"
  AND map."oldId" = wiw."workstreamId";

UPDATE "SharedCapability" sc
SET "primaryWorkstreamId" = map."newId"
FROM "_WorkstreamProjectMap" map
WHERE map."projectId" = sc."projectId"
  AND map."oldId" = sc."primaryWorkstreamId";

UPDATE "SharedCapabilityWorkstream" scw
SET "workstreamId" = map."newId"
FROM "SharedCapability" sc, "_WorkstreamProjectMap" map
WHERE sc."id" = scw."sharedCapabilityId"
  AND map."projectId" = sc."projectId"
  AND map."oldId" = scw."workstreamId";

UPDATE "Risk" r
SET "primaryWorkstreamId" = map."newId"
FROM "_WorkstreamProjectMap" map
WHERE map."projectId" = r."projectId"
  AND map."oldId" = r."primaryWorkstreamId";

UPDATE "DecisionWorkstream" dw
SET "workstreamId" = map."newId"
FROM "Decision" d, "_WorkstreamProjectMap" map
WHERE d."id" = dw."decisionId"
  AND map."projectId" = d."projectId"
  AND map."oldId" = dw."workstreamId";

DELETE FROM "Workstream" WHERE "projectId" IS NULL;

ALTER TABLE "Workstream"
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "Workstream"
ADD CONSTRAINT "Workstream_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Workstream_projectId_code_key"
ON "Workstream"("projectId", "code");
CREATE UNIQUE INDEX "Workstream_projectId_slug_key"
ON "Workstream"("projectId", "slug");
CREATE UNIQUE INDEX "Workstream_projectId_name_key"
ON "Workstream"("projectId", "name");
CREATE INDEX "Workstream_projectId_archivedAt_sortOrder_idx"
ON "Workstream"("projectId", "archivedAt", "sortOrder");

DROP TYPE "WorkstreamCode";
