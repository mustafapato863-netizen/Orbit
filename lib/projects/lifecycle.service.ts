export type WorkPackageStage = "NS" | "IP" | "CHK" | "RPR" | "LIVE";
export type DeploymentEnvironment = "LOCAL" | "STAGING" | "PRODUCTION";
export type ReleaseScope = "INTERNAL" | "PILOT" | "FULL_RELEASE";
export type DeliveryHealth = "ON_TRACK" | "AT_RISK" | "BLOCKED" | "OVERDUE";

export const WorkPackageStageValues = {
  NS: "NS" as WorkPackageStage,
  IP: "IP" as WorkPackageStage,
  CHK: "CHK" as WorkPackageStage,
  RPR: "RPR" as WorkPackageStage,
  LIVE: "LIVE" as WorkPackageStage,
};

export type StageConfig = {
  code: WorkPackageStage;
  label: string;
  shortLabel: string;
  description: string;
  minProgress: number;
  maxProgress: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
};

export const WORK_PACKAGE_STAGES: Record<WorkPackageStage, StageConfig> = {
  NS: {
    code: "NS",
    label: "Not Started",
    shortLabel: "NS",
    description: "The item is defined in the project plan and is waiting to start.",
    minProgress: 0,
    maxProgress: 0,
    colorClass: "text-slate-400",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-500/20",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  IP: {
    code: "IP",
    label: "In Progress",
    shortLabel: "IP",
    description: "Work on the item is currently active.",
    minProgress: 11,
    maxProgress: 100,
    colorClass: "text-cyan-400",
    bgClass: "bg-cyan-500/10",
    borderClass: "border-cyan-500/20",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  CHK: {
    code: "CHK",
    label: "Under Review",
    shortLabel: "REV",
    description: "Delivery work is ready for review or validation.",
    minProgress: 85,
    maxProgress: 94,
    colorClass: "text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/20",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  RPR: {
    code: "RPR",
    label: "Approved",
    shortLabel: "APR",
    description: "The item has passed review and received the required approval.",
    minProgress: 95,
    maxProgress: 99,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  LIVE: {
    code: "LIVE",
    label: "Completed",
    shortLabel: "DONE",
    description: "The planned item has been delivered and completed.",
    minProgress: 100,
    maxProgress: 100,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

export function mapLegacyStageToWorkPackageStage(
  legacyStage?: string | null,
  status?: string | null,
  progress?: number | null,
): WorkPackageStage {
  if (progress === 100 || legacyStage === "PRODUCTION") {
    return "LIVE";
  }
  if (legacyStage === "STAGING" || legacyStage === "CONTROLLED_PILOT") {
    return "RPR";
  }
  if (
    legacyStage === "TECHNICAL_VERIFICATION" ||
    legacyStage === "BUSINESS_UAT"
  ) {
    return "CHK";
  }
  if (
    legacyStage === "IN_DEVELOPMENT" ||
    status === "IN_PROGRESS" ||
    (progress ?? 0) > 0
  ) {
    return "IP";
  }
  return "NS";
}

export function validateStageAndProgress(
  stage: WorkPackageStage,
  progress: number,
): { valid: boolean; message?: string } {
  const config = WORK_PACKAGE_STAGES[stage];
  if (!config) {
    return { valid: false, message: `Invalid stage: ${stage}` };
  }
  if (progress < 0 || progress > 100) {
    return { valid: false, message: "Progress must be between 0 and 100." };
  }
  if (stage === "NS" && progress !== 0) {
    return { valid: false, message: "Not Started (NS) work package must have 0% progress." };
  }
  if (stage === "LIVE" && progress !== 100) {
    return { valid: false, message: "Completed items must have 100% progress." };
  }
  if (stage === "CHK" && (progress < 85 || progress > 94)) {
    return { valid: false, message: "Items under review must have progress between 85% and 94%." };
  }
  if (stage === "RPR" && (progress < 95 || progress > 99)) {
    return { valid: false, message: "Approved items must have progress between 95% and 99%." };
  }
  if (stage === "IP" && (progress < 11 || progress > 100)) {
    return { valid: false, message: "In Progress (IP) must have progress between 11% and 100%." };
  }
  return { valid: true };
}

export function calculateDeliveryHealth(item: {
  lifecycleStage?: WorkPackageStage | null;
  dueDate?: Date | string | null;
  blockerSummary?: string | null;
  blocker?: string | null;
  deliveryHealth?: DeliveryHealth | null;
  status?: string | null;
}): DeliveryHealth {
  if (item.deliveryHealth && item.deliveryHealth !== "ON_TRACK") {
    return item.deliveryHealth;
  }
  if (item.blockerSummary || item.blocker || item.status === "BLOCKED") {
    return "BLOCKED";
  }
  if (item.status === "AT_RISK") {
    return "AT_RISK";
  }

  const stage = item.lifecycleStage ?? "NS";
  if (stage !== "LIVE" && item.dueDate) {
    const due = typeof item.dueDate === "string" ? new Date(item.dueDate) : item.dueDate;
    if (due < new Date()) {
      return "OVERDUE";
    }
  }

  return "ON_TRACK";
}
