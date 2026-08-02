-- Add administrator-managed portfolio groups without changing existing projects.
CREATE TABLE "ProjectGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "colorToken" VARCHAR(80) NOT NULL DEFAULT '#7157e8',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project"
ADD COLUMN "projectGroupId" UUID;

CREATE UNIQUE INDEX "ProjectGroup_slug_key" ON "ProjectGroup"("slug");
CREATE INDEX "ProjectGroup_archivedAt_sortOrder_idx"
ON "ProjectGroup"("archivedAt", "sortOrder");
CREATE INDEX "Project_projectGroupId_archivedAt_idx"
ON "Project"("projectGroupId", "archivedAt");

ALTER TABLE "Project"
ADD CONSTRAINT "Project_projectGroupId_fkey"
FOREIGN KEY ("projectGroupId") REFERENCES "ProjectGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
