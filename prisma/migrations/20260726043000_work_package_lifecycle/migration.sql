-- CreateEnum
CREATE TYPE "WorkPackageStage" AS ENUM ('NS', 'IP', 'CHK', 'RPR', 'LIVE');

-- CreateEnum
CREATE TYPE "DeploymentEnvironment" AS ENUM ('LOCAL', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ReleaseScope" AS ENUM ('INTERNAL', 'PILOT', 'FULL_RELEASE');

-- CreateEnum
CREATE TYPE "DeliveryHealth" AS ENUM ('ON_TRACK', 'AT_RISK', 'BLOCKED', 'OVERDUE');

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "actualCheckDate" DATE,
ADD COLUMN     "actualGoLiveDate" DATE,
ADD COLUMN     "actualProductionReadyDate" DATE,
ADD COLUMN     "actualStartDate" DATE,
ADD COLUMN     "blockerSummary" TEXT,
ADD COLUMN     "deliveryHealth" "DeliveryHealth" NOT NULL DEFAULT 'ON_TRACK',
ADD COLUMN     "deploymentEnvironment" "DeploymentEnvironment" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "implementationNotes" TEXT,
ADD COLUMN     "lifecycleStage" "WorkPackageStage" NOT NULL DEFAULT 'NS',
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "plannedCheckDate" DATE,
ADD COLUMN     "plannedGoLiveDate" DATE,
ADD COLUMN     "plannedProductionReadyDate" DATE,
ADD COLUMN     "plannedStartDate" DATE,
ADD COLUMN     "releaseScope" "ReleaseScope" NOT NULL DEFAULT 'INTERNAL';

-- CreateTable
CREATE TABLE "WorkPackageCheckpoint" (
    "id" UUID NOT NULL,
    "workItemId" UUID NOT NULL,
    "checkpointCode" VARCHAR(40) NOT NULL,
    "plannedDate" DATE,
    "actualDate" DATE,
    "status" VARCHAR(40) NOT NULL DEFAULT 'Pending',
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkPackageCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkPackageCheckpoint_workItemId_checkpointCode_idx" ON "WorkPackageCheckpoint"("workItemId", "checkpointCode");

-- CreateIndex
CREATE UNIQUE INDEX "WorkPackageCheckpoint_workItemId_checkpointCode_key" ON "WorkPackageCheckpoint"("workItemId", "checkpointCode");

-- CreateIndex
CREATE INDEX "WorkItem_lifecycleStage_deliveryHealth_idx" ON "WorkItem"("lifecycleStage", "deliveryHealth");

-- AddForeignKey
ALTER TABLE "WorkPackageCheckpoint" ADD CONSTRAINT "WorkPackageCheckpoint_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
