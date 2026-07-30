-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'BLOCKED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATING', 'ACCEPTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryStageCode" AS ENUM ('NOT_STARTED', 'IN_DEVELOPMENT', 'TECHNICAL_VERIFICATION', 'BUSINESS_UAT', 'STAGING', 'CONTROLLED_PILOT', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "WorkstreamCode" AS ENUM ('FRONTEND', 'BACKEND', 'DATABASE');

-- CreateEnum
CREATE TYPE "ReleaseHorizon" AS ENUM ('RELEASE_1', 'PHASE_2');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DEFERRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('PROJECT_MANAGER', 'TECHNICAL_LEAD', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PilotCapabilityDisposition" AS ENUM ('INCLUDED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "PilotCriterionType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "PilotCriterionStatus" AS ENUM ('NOT_STARTED', 'MET', 'NOT_MET', 'WAIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "normalizedEmail" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(160) NOT NULL,
    "passwordHash" VARCHAR(255),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATE,
    "targetDate" DATE,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "businessPurpose" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "deliveryStage" "DeliveryStageCode" NOT NULL DEFAULT 'NOT_STARTED',
    "releaseHorizon" "ReleaseHorizon" NOT NULL DEFAULT 'RELEASE_1',
    "startDate" DATE,
    "dueDate" DATE,
    "deliveredScope" TEXT,
    "remainingScope" TEXT,
    "currentBlockers" TEXT,
    "nextAction" TEXT,
    "firstReleaseImpact" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" UUID NOT NULL,
    "milestoneId" UUID NOT NULL,
    "primaryWorkstreamId" UUID NOT NULL,
    "ownerId" UUID,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "acceptanceCriteria" TEXT,
    "notes" TEXT,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "deliveryStage" "DeliveryStageCode" NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATE,
    "dueDate" DATE,
    "nextGate" VARCHAR(240),
    "blocker" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCapability" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "primaryWorkstreamId" UUID NOT NULL,
    "ownerId" UUID,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "acceptanceCriteria" TEXT,
    "notes" TEXT,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "deliveryStage" "DeliveryStageCode" NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATE,
    "dueDate" DATE,
    "nextGate" VARCHAR(240),
    "blocker" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SharedCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneSharedCapability" (
    "projectId" UUID NOT NULL,
    "milestoneId" UUID NOT NULL,
    "sharedCapabilityId" UUID NOT NULL,
    "dependencyNotes" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MilestoneSharedCapability_pkey" PRIMARY KEY ("milestoneId","sharedCapabilityId")
);

-- CreateTable
CREATE TABLE "Workstream" (
    "id" UUID NOT NULL,
    "code" "WorkstreamCode" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "colorToken" VARCHAR(80) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Workstream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItemWorkstream" (
    "workItemId" UUID NOT NULL,
    "workstreamId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkItemWorkstream_pkey" PRIMARY KEY ("workItemId","workstreamId")
);

-- CreateTable
CREATE TABLE "SharedCapabilityWorkstream" (
    "sharedCapabilityId" UUID NOT NULL,
    "workstreamId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SharedCapabilityWorkstream_pkey" PRIMARY KEY ("sharedCapabilityId","workstreamId")
);

-- CreateTable
CREATE TABLE "DeliveryStageHistory" (
    "id" UUID NOT NULL,
    "workItemId" UUID,
    "sharedCapabilityId" UUID,
    "fromStage" "DeliveryStageCode",
    "toStage" "DeliveryStageCode" NOT NULL,
    "changedById" UUID,
    "notes" TEXT,
    "changedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DeliveryStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "milestoneId" UUID,
    "workItemId" UUID,
    "sharedCapabilityId" UUID,
    "primaryWorkstreamId" UUID,
    "ownerId" UUID,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "severity" "RiskLevel" NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "mitigation" TEXT,
    "dueDate" DATE,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "milestoneId" UUID,
    "ownerId" UUID,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "requiredBy" DATE,
    "recommendedDirection" TEXT,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PENDING',
    "decisionText" TEXT,
    "decidedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionWorkstream" (
    "decisionId" UUID NOT NULL,
    "workstreamId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DecisionWorkstream_pkey" PRIMARY KEY ("decisionId","workstreamId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "authorId" UUID,
    "parentCommentId" UUID,
    "milestoneId" UUID,
    "workItemId" UUID,
    "sharedCapabilityId" UUID,
    "riskId" UUID,
    "decisionId" UUID,
    "pilotScopeId" UUID,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotScope" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "supportOwnerId" UUID,
    "rollbackOwnerId" UUID,
    "businessSignOffById" UUID,
    "technicalSignOffById" UUID,
    "name" VARCHAR(200) NOT NULL,
    "knownLimitations" TEXT,
    "finalDecisionStatus" "DecisionStatus" NOT NULL DEFAULT 'PENDING',
    "finalDecision" TEXT,
    "businessSignedOffAt" TIMESTAMPTZ(3),
    "technicalSignedOffAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotTeam" (
    "id" UUID NOT NULL,
    "pilotScopeId" UUID NOT NULL,
    "leadUserId" UUID,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotTeamMember" (
    "pilotTeamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotTeamMember_pkey" PRIMARY KEY ("pilotTeamId","userId")
);

-- CreateTable
CREATE TABLE "PilotCriterion" (
    "id" UUID NOT NULL,
    "pilotScopeId" UUID NOT NULL,
    "reviewerId" UUID,
    "code" VARCHAR(40) NOT NULL,
    "type" "PilotCriterionType" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "PilotCriterionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "evidence" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotScopeCapability" (
    "projectId" UUID NOT NULL,
    "pilotScopeId" UUID NOT NULL,
    "sharedCapabilityId" UUID NOT NULL,
    "disposition" "PilotCapabilityDisposition" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PilotScopeCapability_pkey" PRIMARY KEY ("pilotScopeId","sharedCapabilityId")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "generatedById" UUID,
    "reportType" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(240) NOT NULL,
    "parameters" JSONB,
    "snapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "actorId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(120) NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

-- CreateIndex
CREATE INDEX "User_isActive_archivedAt_idx" ON "User"("isActive", "archivedAt");

-- CreateIndex
CREATE INDEX "User_displayName_idx" ON "User"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Role_archivedAt_idx" ON "Role"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_archivedAt_idx" ON "Permission"("archivedAt");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "UserRole_assignedById_idx" ON "UserRole"("assignedById");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_archivedAt_idx" ON "Project"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "Project_targetDate_idx" ON "Project"("targetDate");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_role_archivedAt_idx" ON "ProjectMember"("projectId", "role", "archivedAt");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_archivedAt_idx" ON "ProjectMember"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "Milestone_projectId_releaseHorizon_status_idx" ON "Milestone"("projectId", "releaseHorizon", "status");

-- CreateIndex
CREATE INDEX "Milestone_projectId_deliveryStage_idx" ON "Milestone"("projectId", "deliveryStage");

-- CreateIndex
CREATE INDEX "Milestone_dueDate_status_idx" ON "Milestone"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Milestone_archivedAt_idx" ON "Milestone"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_projectId_code_key" ON "Milestone"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_id_projectId_key" ON "Milestone"("id", "projectId");

-- CreateIndex
CREATE INDEX "WorkItem_milestoneId_status_archivedAt_idx" ON "WorkItem"("milestoneId", "status", "archivedAt");

-- CreateIndex
CREATE INDEX "WorkItem_primaryWorkstreamId_status_idx" ON "WorkItem"("primaryWorkstreamId", "status");

-- CreateIndex
CREATE INDEX "WorkItem_ownerId_status_idx" ON "WorkItem"("ownerId", "status");

-- CreateIndex
CREATE INDEX "WorkItem_deliveryStage_dueDate_idx" ON "WorkItem"("deliveryStage", "dueDate");

-- CreateIndex
CREATE INDEX "WorkItem_archivedAt_idx" ON "WorkItem"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_milestoneId_code_key" ON "WorkItem"("milestoneId", "code");

-- CreateIndex
CREATE INDEX "SharedCapability_projectId_status_archivedAt_idx" ON "SharedCapability"("projectId", "status", "archivedAt");

-- CreateIndex
CREATE INDEX "SharedCapability_primaryWorkstreamId_status_idx" ON "SharedCapability"("primaryWorkstreamId", "status");

-- CreateIndex
CREATE INDEX "SharedCapability_ownerId_status_idx" ON "SharedCapability"("ownerId", "status");

-- CreateIndex
CREATE INDEX "SharedCapability_deliveryStage_dueDate_idx" ON "SharedCapability"("deliveryStage", "dueDate");

-- CreateIndex
CREATE INDEX "SharedCapability_archivedAt_idx" ON "SharedCapability"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCapability_projectId_code_key" ON "SharedCapability"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCapability_projectId_name_key" ON "SharedCapability"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCapability_id_projectId_key" ON "SharedCapability"("id", "projectId");

-- CreateIndex
CREATE INDEX "MilestoneSharedCapability_sharedCapabilityId_milestoneId_idx" ON "MilestoneSharedCapability"("sharedCapabilityId", "milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Workstream_code_key" ON "Workstream"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Workstream_name_key" ON "Workstream"("name");

-- CreateIndex
CREATE INDEX "Workstream_archivedAt_idx" ON "Workstream"("archivedAt");

-- CreateIndex
CREATE INDEX "WorkItemWorkstream_workstreamId_workItemId_idx" ON "WorkItemWorkstream"("workstreamId", "workItemId");

-- CreateIndex
CREATE INDEX "SharedCapabilityWorkstream_workstreamId_sharedCapabilityId_idx" ON "SharedCapabilityWorkstream"("workstreamId", "sharedCapabilityId");

-- CreateIndex
CREATE INDEX "DeliveryStageHistory_workItemId_changedAt_idx" ON "DeliveryStageHistory"("workItemId", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "DeliveryStageHistory_sharedCapabilityId_changedAt_idx" ON "DeliveryStageHistory"("sharedCapabilityId", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "DeliveryStageHistory_changedById_changedAt_idx" ON "DeliveryStageHistory"("changedById", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "Risk_projectId_status_severity_idx" ON "Risk"("projectId", "status", "severity");

-- CreateIndex
CREATE INDEX "Risk_projectId_dueDate_idx" ON "Risk"("projectId", "dueDate");

-- CreateIndex
CREATE INDEX "Risk_milestoneId_idx" ON "Risk"("milestoneId");

-- CreateIndex
CREATE INDEX "Risk_workItemId_idx" ON "Risk"("workItemId");

-- CreateIndex
CREATE INDEX "Risk_sharedCapabilityId_idx" ON "Risk"("sharedCapabilityId");

-- CreateIndex
CREATE INDEX "Risk_primaryWorkstreamId_status_idx" ON "Risk"("primaryWorkstreamId", "status");

-- CreateIndex
CREATE INDEX "Risk_ownerId_status_idx" ON "Risk"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Risk_archivedAt_idx" ON "Risk"("archivedAt");

-- CreateIndex
CREATE INDEX "Decision_projectId_status_requiredBy_idx" ON "Decision"("projectId", "status", "requiredBy");

-- CreateIndex
CREATE INDEX "Decision_milestoneId_status_idx" ON "Decision"("milestoneId", "status");

-- CreateIndex
CREATE INDEX "Decision_ownerId_status_idx" ON "Decision"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Decision_archivedAt_idx" ON "Decision"("archivedAt");

-- CreateIndex
CREATE INDEX "DecisionWorkstream_workstreamId_decisionId_idx" ON "DecisionWorkstream"("workstreamId", "decisionId");

-- CreateIndex
CREATE INDEX "Comment_projectId_createdAt_idx" ON "Comment"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_authorId_createdAt_idx" ON "Comment"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "Comment_milestoneId_createdAt_idx" ON "Comment"("milestoneId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_workItemId_createdAt_idx" ON "Comment"("workItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_sharedCapabilityId_createdAt_idx" ON "Comment"("sharedCapabilityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_riskId_createdAt_idx" ON "Comment"("riskId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_decisionId_createdAt_idx" ON "Comment"("decisionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_pilotScopeId_createdAt_idx" ON "Comment"("pilotScopeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_archivedAt_idx" ON "Comment"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PilotScope_projectId_key" ON "PilotScope"("projectId");

-- CreateIndex
CREATE INDEX "PilotScope_finalDecisionStatus_archivedAt_idx" ON "PilotScope"("finalDecisionStatus", "archivedAt");

-- CreateIndex
CREATE INDEX "PilotScope_supportOwnerId_idx" ON "PilotScope"("supportOwnerId");

-- CreateIndex
CREATE INDEX "PilotScope_rollbackOwnerId_idx" ON "PilotScope"("rollbackOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "PilotScope_id_projectId_key" ON "PilotScope"("id", "projectId");

-- CreateIndex
CREATE INDEX "PilotTeam_leadUserId_idx" ON "PilotTeam"("leadUserId");

-- CreateIndex
CREATE INDEX "PilotTeam_archivedAt_idx" ON "PilotTeam"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PilotTeam_pilotScopeId_name_key" ON "PilotTeam"("pilotScopeId", "name");

-- CreateIndex
CREATE INDEX "PilotTeamMember_userId_archivedAt_idx" ON "PilotTeamMember"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "PilotCriterion_pilotScopeId_type_status_idx" ON "PilotCriterion"("pilotScopeId", "type", "status");

-- CreateIndex
CREATE INDEX "PilotCriterion_reviewerId_status_idx" ON "PilotCriterion"("reviewerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PilotCriterion_pilotScopeId_code_key" ON "PilotCriterion"("pilotScopeId", "code");

-- CreateIndex
CREATE INDEX "PilotScopeCapability_sharedCapabilityId_disposition_idx" ON "PilotScopeCapability"("sharedCapabilityId", "disposition");

-- CreateIndex
CREATE INDEX "ReportSnapshot_projectId_generatedAt_idx" ON "ReportSnapshot"("projectId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "ReportSnapshot_generatedById_generatedAt_idx" ON "ReportSnapshot"("generatedById", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "ReportSnapshot_archivedAt_idx" ON "ReportSnapshot"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSnapshot_projectId_reportType_version_key" ON "ReportSnapshot"("projectId", "reportType", "version");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_primaryWorkstreamId_fkey" FOREIGN KEY ("primaryWorkstreamId") REFERENCES "Workstream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCapability" ADD CONSTRAINT "SharedCapability_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCapability" ADD CONSTRAINT "SharedCapability_primaryWorkstreamId_fkey" FOREIGN KEY ("primaryWorkstreamId") REFERENCES "Workstream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCapability" ADD CONSTRAINT "SharedCapability_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneSharedCapability" ADD CONSTRAINT "MilestoneSharedCapability_milestoneId_projectId_fkey" FOREIGN KEY ("milestoneId", "projectId") REFERENCES "Milestone"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneSharedCapability" ADD CONSTRAINT "MilestoneSharedCapability_sharedCapabilityId_projectId_fkey" FOREIGN KEY ("sharedCapabilityId", "projectId") REFERENCES "SharedCapability"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemWorkstream" ADD CONSTRAINT "WorkItemWorkstream_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemWorkstream" ADD CONSTRAINT "WorkItemWorkstream_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "Workstream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCapabilityWorkstream" ADD CONSTRAINT "SharedCapabilityWorkstream_sharedCapabilityId_fkey" FOREIGN KEY ("sharedCapabilityId") REFERENCES "SharedCapability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCapabilityWorkstream" ADD CONSTRAINT "SharedCapabilityWorkstream_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "Workstream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStageHistory" ADD CONSTRAINT "DeliveryStageHistory_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStageHistory" ADD CONSTRAINT "DeliveryStageHistory_sharedCapabilityId_fkey" FOREIGN KEY ("sharedCapabilityId") REFERENCES "SharedCapability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStageHistory" ADD CONSTRAINT "DeliveryStageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_sharedCapabilityId_fkey" FOREIGN KEY ("sharedCapabilityId") REFERENCES "SharedCapability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_primaryWorkstreamId_fkey" FOREIGN KEY ("primaryWorkstreamId") REFERENCES "Workstream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionWorkstream" ADD CONSTRAINT "DecisionWorkstream_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionWorkstream" ADD CONSTRAINT "DecisionWorkstream_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "Workstream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_sharedCapabilityId_fkey" FOREIGN KEY ("sharedCapabilityId") REFERENCES "SharedCapability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_pilotScopeId_fkey" FOREIGN KEY ("pilotScopeId") REFERENCES "PilotScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScope" ADD CONSTRAINT "PilotScope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScope" ADD CONSTRAINT "PilotScope_supportOwnerId_fkey" FOREIGN KEY ("supportOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScope" ADD CONSTRAINT "PilotScope_rollbackOwnerId_fkey" FOREIGN KEY ("rollbackOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScope" ADD CONSTRAINT "PilotScope_businessSignOffById_fkey" FOREIGN KEY ("businessSignOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScope" ADD CONSTRAINT "PilotScope_technicalSignOffById_fkey" FOREIGN KEY ("technicalSignOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotTeam" ADD CONSTRAINT "PilotTeam_pilotScopeId_fkey" FOREIGN KEY ("pilotScopeId") REFERENCES "PilotScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotTeam" ADD CONSTRAINT "PilotTeam_leadUserId_fkey" FOREIGN KEY ("leadUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotTeamMember" ADD CONSTRAINT "PilotTeamMember_pilotTeamId_fkey" FOREIGN KEY ("pilotTeamId") REFERENCES "PilotTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotTeamMember" ADD CONSTRAINT "PilotTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotCriterion" ADD CONSTRAINT "PilotCriterion_pilotScopeId_fkey" FOREIGN KEY ("pilotScopeId") REFERENCES "PilotScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotCriterion" ADD CONSTRAINT "PilotCriterion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScopeCapability" ADD CONSTRAINT "PilotScopeCapability_pilotScopeId_projectId_fkey" FOREIGN KEY ("pilotScopeId", "projectId") REFERENCES "PilotScope"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotScopeCapability" ADD CONSTRAINT "PilotScopeCapability_sharedCapabilityId_projectId_fkey" FOREIGN KEY ("sharedCapabilityId", "projectId") REFERENCES "SharedCapability"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "User"
ADD CONSTRAINT "User_normalizedEmail_lowercase_check"
CHECK ("normalizedEmail" = lower("normalizedEmail"));

-- AddCheckConstraint
ALTER TABLE "Project"
ADD CONSTRAINT "Project_progress_check"
CHECK ("progress" BETWEEN 0 AND 100);

-- AddCheckConstraint
ALTER TABLE "Project"
ADD CONSTRAINT "Project_dates_check"
CHECK ("startDate" IS NULL OR "targetDate" IS NULL OR "startDate" <= "targetDate");

-- AddCheckConstraint
ALTER TABLE "Milestone"
ADD CONSTRAINT "Milestone_progress_check"
CHECK ("progress" BETWEEN 0 AND 100);

-- AddCheckConstraint
ALTER TABLE "Milestone"
ADD CONSTRAINT "Milestone_dates_check"
CHECK ("startDate" IS NULL OR "dueDate" IS NULL OR "startDate" <= "dueDate");

-- AddCheckConstraint
ALTER TABLE "WorkItem"
ADD CONSTRAINT "WorkItem_progress_check"
CHECK ("progress" BETWEEN 0 AND 100);

-- AddCheckConstraint
ALTER TABLE "WorkItem"
ADD CONSTRAINT "WorkItem_dates_check"
CHECK ("startDate" IS NULL OR "dueDate" IS NULL OR "startDate" <= "dueDate");

-- AddCheckConstraint
ALTER TABLE "SharedCapability"
ADD CONSTRAINT "SharedCapability_progress_check"
CHECK ("progress" BETWEEN 0 AND 100);

-- AddCheckConstraint
ALTER TABLE "SharedCapability"
ADD CONSTRAINT "SharedCapability_dates_check"
CHECK ("startDate" IS NULL OR "dueDate" IS NULL OR "startDate" <= "dueDate");

-- AddCheckConstraint
ALTER TABLE "DeliveryStageHistory"
ADD CONSTRAINT "DeliveryStageHistory_target_check"
CHECK (num_nonnulls("workItemId", "sharedCapabilityId") = 1);

-- AddCheckConstraint
ALTER TABLE "DeliveryStageHistory"
ADD CONSTRAINT "DeliveryStageHistory_transition_check"
CHECK ("fromStage" IS NULL OR "fromStage" <> "toStage");

-- AddCheckConstraint
ALTER TABLE "Risk"
ADD CONSTRAINT "Risk_probability_check"
CHECK ("probability" BETWEEN 1 AND 5);

-- AddCheckConstraint
ALTER TABLE "Risk"
ADD CONSTRAINT "Risk_impact_check"
CHECK ("impact" BETWEEN 1 AND 5);

-- AddCheckConstraint
ALTER TABLE "Risk"
ADD CONSTRAINT "Risk_specific_target_check"
CHECK (num_nonnulls("workItemId", "sharedCapabilityId") <= 1);

-- AddCheckConstraint
ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_single_target_check"
CHECK (
  num_nonnulls(
    "milestoneId",
    "workItemId",
    "sharedCapabilityId",
    "riskId",
    "decisionId",
    "pilotScopeId"
  ) <= 1
);

-- AddCheckConstraint
ALTER TABLE "PilotScope"
ADD CONSTRAINT "PilotScope_business_signoff_check"
CHECK (("businessSignOffById" IS NULL) = ("businessSignedOffAt" IS NULL));

-- AddCheckConstraint
ALTER TABLE "PilotScope"
ADD CONSTRAINT "PilotScope_technical_signoff_check"
CHECK (("technicalSignOffById" IS NULL) = ("technicalSignedOffAt" IS NULL));

-- AddCheckConstraint
ALTER TABLE "ReportSnapshot"
ADD CONSTRAINT "ReportSnapshot_version_check"
CHECK ("version" > 0);

-- A supporting workstream may not duplicate the required primary workstream.
CREATE FUNCTION "enforce_work_item_supporting_workstream"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "WorkItem"
    WHERE "id" = NEW."workItemId"
      AND "primaryWorkstreamId" = NEW."workstreamId"
  ) THEN
    RAISE EXCEPTION 'A work item supporting workstream cannot equal its primary workstream.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'WorkItemWorkstream_not_primary_check';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkItemWorkstream_not_primary_trigger"
BEFORE INSERT OR UPDATE ON "WorkItemWorkstream"
FOR EACH ROW
EXECUTE FUNCTION "enforce_work_item_supporting_workstream"();

CREATE FUNCTION "enforce_work_item_primary_workstream"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "WorkItemWorkstream"
    WHERE "workItemId" = NEW."id"
      AND "workstreamId" = NEW."primaryWorkstreamId"
  ) THEN
    RAISE EXCEPTION 'A work item primary workstream cannot also be supporting.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'WorkItem_primary_not_supporting_check';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkItem_primary_not_supporting_trigger"
BEFORE INSERT OR UPDATE OF "primaryWorkstreamId" ON "WorkItem"
FOR EACH ROW
EXECUTE FUNCTION "enforce_work_item_primary_workstream"();

-- Shared capabilities use the same canonical primary/supporting rule.
CREATE FUNCTION "enforce_capability_supporting_workstream"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SharedCapability"
    WHERE "id" = NEW."sharedCapabilityId"
      AND "primaryWorkstreamId" = NEW."workstreamId"
  ) THEN
    RAISE EXCEPTION 'A shared capability supporting workstream cannot equal its primary workstream.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'SharedCapabilityWorkstream_not_primary_check';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SharedCapabilityWorkstream_not_primary_trigger"
BEFORE INSERT OR UPDATE ON "SharedCapabilityWorkstream"
FOR EACH ROW
EXECUTE FUNCTION "enforce_capability_supporting_workstream"();

CREATE FUNCTION "enforce_capability_primary_workstream"()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SharedCapabilityWorkstream"
    WHERE "sharedCapabilityId" = NEW."id"
      AND "workstreamId" = NEW."primaryWorkstreamId"
  ) THEN
    RAISE EXCEPTION 'A shared capability primary workstream cannot also be supporting.'
      USING ERRCODE = '23514',
            CONSTRAINT = 'SharedCapability_primary_not_supporting_check';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SharedCapability_primary_not_supporting_trigger"
BEFORE INSERT OR UPDATE OF "primaryWorkstreamId" ON "SharedCapability"
FOR EACH ROW
EXECUTE FUNCTION "enforce_capability_primary_workstream"();
