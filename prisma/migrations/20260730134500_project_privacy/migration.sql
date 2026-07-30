-- Existing projects remain member-visible. Administrators may opt individual
-- projects into administrator-only visibility after this migration.
ALTER TABLE "Project"
ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Project_isPrivate_archivedAt_idx"
ON "Project"("isPrivate", "archivedAt");
