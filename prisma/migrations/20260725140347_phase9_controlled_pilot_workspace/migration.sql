-- CreateEnum
CREATE TYPE "PilotSignOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PilotIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "PilotScope" ADD COLUMN     "businessSignOffStatus" "PilotSignOffStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "technicalSignOffStatus" "PilotSignOffStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "PilotIssue" (
    "id" UUID NOT NULL,
    "pilotScopeId" UUID NOT NULL,
    "ownerId" UUID,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "severity" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "PilotIssueStatus" NOT NULL DEFAULT 'OPEN',
    "isBlocking" BOOLEAN NOT NULL DEFAULT true,
    "mitigation" TEXT,
    "dueDate" DATE,
    "resolvedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PilotIssue_pilotScopeId_status_severity_idx" ON "PilotIssue"("pilotScopeId", "status", "severity");

-- CreateIndex
CREATE INDEX "PilotIssue_ownerId_status_idx" ON "PilotIssue"("ownerId", "status");

-- CreateIndex
CREATE INDEX "PilotIssue_dueDate_status_idx" ON "PilotIssue"("dueDate", "status");

-- CreateIndex
CREATE INDEX "PilotIssue_archivedAt_idx" ON "PilotIssue"("archivedAt");

-- AddForeignKey
ALTER TABLE "PilotIssue" ADD CONSTRAINT "PilotIssue_pilotScopeId_fkey" FOREIGN KEY ("pilotScopeId") REFERENCES "PilotScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotIssue" ADD CONSTRAINT "PilotIssue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
