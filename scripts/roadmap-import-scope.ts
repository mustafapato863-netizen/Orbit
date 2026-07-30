export type RoadmapImportScope =
  | "full"
  | "technical-only"
  | "business-only";

type PhaseLike<Item extends { code: string } = { code: string }> = {
  code: string;
  phaseType: "TECHNICAL" | "BUSINESS";
  workItems: readonly Item[];
};

type RoadmapLike<Phase extends PhaseLike = PhaseLike> = {
  phases: readonly Phase[];
  sharedCapabilities: readonly unknown[];
};

type StoredMilestoneLike<
  Item extends { code: string } = { code: string },
> = {
  code: string;
  workItems: readonly Item[];
};

type StoredRoadmapLike<
  Milestone extends StoredMilestoneLike = StoredMilestoneLike,
> = {
  milestones: readonly Milestone[];
  sharedCapabilities: readonly unknown[];
};

type StoredTechnicalMilestone = {
  id: string;
  code: string;
  workItems: readonly {
    id: string;
    code: string;
  }[];
};

export function isTechnicalPhaseCode(code: string) {
  return code.startsWith("PH-");
}

export function isBusinessPhaseCode(code: string) {
  return code.startsWith("BPH-");
}

export function phasesForImport<Phase extends PhaseLike>(
  phases: readonly Phase[],
  scope: RoadmapImportScope,
) {
  if (scope === "full") return [...phases];

  return phases.filter((phase) =>
    scope === "technical-only"
      ? phase.phaseType === "TECHNICAL" &&
        isTechnicalPhaseCode(phase.code)
      : phase.phaseType === "BUSINESS" &&
        isBusinessPhaseCode(phase.code),
  );
}

export function documentCountsForImport(
  document: RoadmapLike,
  scope: RoadmapImportScope,
) {
  const phases = phasesForImport(document.phases, scope);

  return {
    phases: phases.length,
    workItems: phases.reduce(
      (total, phase) => total + phase.workItems.length,
      0,
    ),
    sharedCapabilities:
      scope === "full" ? document.sharedCapabilities.length : 0,
  };
}

export function storedCountsForImport(
  project: StoredRoadmapLike,
  scope: RoadmapImportScope,
) {
  const milestones =
    scope === "full"
      ? project.milestones
      : project.milestones.filter(({ code }) =>
          scope === "technical-only"
            ? isTechnicalPhaseCode(code)
            : isBusinessPhaseCode(code),
        );

  return {
    phases: milestones.length,
    workItems: milestones.reduce(
      (total, milestone) => total + milestone.workItems.length,
      0,
    ),
    sharedCapabilities:
      scope === "full" ? project.sharedCapabilities.length : 0,
  };
}

export function buildTechnicalArchivePlan(
  storedMilestones: readonly StoredTechnicalMilestone[],
  importedPhases: readonly PhaseLike[],
) {
  const importedItemsByPhase = new Map(
    importedPhases
      .filter(
        (phase) =>
          phase.phaseType === "TECHNICAL" &&
          isTechnicalPhaseCode(phase.code),
      )
      .map(
        (phase) =>
          [
            phase.code,
            new Set(phase.workItems.map(({ code }) => code)),
          ] as const,
      ),
  );
  const milestoneIds: string[] = [];
  const workItemIds: string[] = [];

  for (const milestone of storedMilestones) {
    if (!isTechnicalPhaseCode(milestone.code)) continue;

    const includedItemCodes = importedItemsByPhase.get(milestone.code);
    if (!includedItemCodes) {
      milestoneIds.push(milestone.id);
      workItemIds.push(...milestone.workItems.map(({ id }) => id));
      continue;
    }

    workItemIds.push(
      ...milestone.workItems
        .filter(({ code }) => !includedItemCodes.has(code))
        .map(({ id }) => id),
    );
  }

  return { milestoneIds, workItemIds };
}

export function buildBusinessArchivePlan(
  storedMilestones: readonly StoredTechnicalMilestone[],
  importedPhases: readonly PhaseLike[],
) {
  const businessPhases = importedPhases.filter(
    (phase) =>
      phase.phaseType === "BUSINESS" &&
      isBusinessPhaseCode(phase.code),
  );
  const importedPhaseCodes = new Set(businessPhases.map(({ code }) => code));
  const importedItemCodes = new Set(
    businessPhases.flatMap(({ workItems }) =>
      workItems.map(({ code }) => code),
    ),
  );
  const milestoneIds: string[] = [];
  const workItemIds: string[] = [];

  for (const milestone of storedMilestones) {
    if (!isBusinessPhaseCode(milestone.code)) continue;

    if (!importedPhaseCodes.has(milestone.code)) {
      milestoneIds.push(milestone.id);
    }
    workItemIds.push(
      ...milestone.workItems
        .filter(({ code }) => !importedItemCodes.has(code))
        .map(({ id }) => id),
    );
  }

  return { milestoneIds, workItemIds };
}
