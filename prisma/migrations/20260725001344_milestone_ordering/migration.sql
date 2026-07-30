-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Preserve deterministic order for any milestones created before Phase 4.
WITH "rankedMilestones" AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "projectId"
            ORDER BY "createdAt", "id"
        ) * 10 AS "position"
    FROM "Milestone"
)
UPDATE "Milestone"
SET "sortOrder" = "rankedMilestones"."position"
FROM "rankedMilestones"
WHERE "Milestone"."id" = "rankedMilestones"."id";

-- CreateIndex
CREATE INDEX "Milestone_projectId_archivedAt_sortOrder_idx" ON "Milestone"("projectId", "archivedAt", "sortOrder");
