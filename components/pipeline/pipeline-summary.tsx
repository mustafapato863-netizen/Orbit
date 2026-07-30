import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CircleDashed,
  ClipboardCheck,
  FlaskConical,
  Hammer,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import type {
  DeliveryPipelineView,
  PipelineStage,
} from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type SummaryStage = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  count: number;
  accent: string;
  bar: string;
  iconClass: string;
};

function stageCount(
  pipeline: DeliveryPipelineView,
  ...stages: PipelineStage[]
) {
  return stages.reduce(
    (total, stage) => total + pipeline.stageCounts[stage],
    0,
  );
}

function summaryStages(pipeline: DeliveryPipelineView): SummaryStage[] {
  return [
    {
      key: "not-started",
      label: "Not Started",
      description: "Pending kickoff",
      icon: CircleDashed,
      count: stageCount(pipeline, "NOT_STARTED"),
      accent: "border-l-[#b7bcc9]",
      bar: "bg-[#b7bcc9]",
      iconClass: "bg-[#eef0f4] text-[#656e82]",
    },
    {
      key: "development",
      label: "In Development",
      description: "Active delivery",
      icon: Hammer,
      count: stageCount(pipeline, "IN_DEVELOPMENT"),
      accent: "border-l-[#0e9f8e]",
      bar: "bg-[#0e9f8e]",
      iconClass: "bg-[#e3f8f4] text-[#0c8e7e]",
    },
    {
      key: "review",
      label: "In Review",
      description: "Technical verification",
      icon: ShieldCheck,
      count: stageCount(pipeline, "TECHNICAL_VERIFICATION"),
      accent: "border-l-[#6e5ae6]",
      bar: "bg-[#6e5ae6]",
      iconClass: "bg-[#efebff] text-[#6350c9]",
    },
    {
      key: "uat",
      label: "UAT",
      description: "User acceptance",
      icon: FlaskConical,
      count: stageCount(pipeline, "BUSINESS_UAT"),
      accent: "border-l-[#e8890c]",
      bar: "bg-[#e8890c]",
      iconClass: "bg-[#fdf1dd] text-[#b96a05]",
    },
    {
      key: "staging",
      label: "Staging",
      description: "Staging and pilot",
      icon: ClipboardCheck,
      count: stageCount(pipeline, "STAGING", "CONTROLLED_PILOT"),
      accent: "border-l-[#2f6fe4]",
      bar: "bg-[#2f6fe4]",
      iconClass: "bg-[#e8f0fe] text-[#2559bd]",
    },
    {
      key: "production",
      label: "Production",
      description: "Live in production",
      icon: Rocket,
      count: stageCount(pipeline, "PRODUCTION"),
      accent: "border-l-[#17924f]",
      bar: "bg-[#17924f]",
      iconClass: "bg-[#e3f7eb] text-[#12793f]",
    },
  ];
}

export function PipelineSummary({
  pipeline,
}: {
  pipeline: DeliveryPipelineView;
}) {
  const stages = summaryStages(pipeline);
  const production = stages.at(-1)?.count ?? 0;
  const productionPercentage = pipeline.totalCanonicalPackages
    ? Math.round((production / pipeline.totalCanonicalPackages) * 100)
    : 0;

  return (
    <div id="delivery-status" className="space-y-3">
      <section
        aria-label="Work package status summary"
        className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7"
      >
        <article className="flex min-h-[108px] flex-col justify-between rounded-xl border border-[#24324f] bg-[linear-gradient(150deg,#213455,#172a49)] px-4 py-3.5 text-white shadow-[0_5px_16px_rgba(24,42,73,0.14)]">
          <div className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <Boxes className="size-4" aria-hidden="true" />
            </span>
            <strong className="text-[1.85rem] font-extrabold leading-none">
              {pipeline.totalCanonicalPackages}
            </strong>
          </div>
          <div>
            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.06em]">
              Total work
            </p>
            <p className="mt-0.5 text-[0.61rem] text-[#b9c4d8]">
              {pipeline.shownCanonicalPackages} shown
              {pipeline.hiddenCanonicalPackages
                ? ` · ${pipeline.hiddenCanonicalPackages} hidden`
                : " · all milestones"}
            </p>
          </div>
        </article>

        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <article
              key={stage.key}
              className={cn(
                "flex min-h-[108px] flex-col justify-between rounded-xl border border-l-[3px] border-[var(--orbit-border)] bg-white px-4 py-3.5 shadow-[var(--orbit-shadow-xs)]",
                stage.accent,
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    stage.iconClass,
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <strong
                  className={cn(
                    "text-[1.85rem] font-extrabold leading-none text-[var(--orbit-text)]",
                    !stage.count && "text-[#a5adbd]",
                  )}
                >
                  {stage.count}
                </strong>
              </div>
              <div>
                <p className="truncate text-[0.62rem] font-extrabold uppercase tracking-[0.045em] text-[var(--orbit-text-muted)]">
                  {stage.label}
                </p>
                <p className="mt-0.5 truncate text-[0.61rem] text-[var(--orbit-text-subtle)]">
                  {stage.description}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section
        aria-label="Stage distribution"
        className="orbit-panel px-4 py-4 sm:px-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[0.82rem] font-bold text-[var(--orbit-text)]">
              Stage distribution
              <span className="ml-1 font-semibold text-[var(--orbit-text-muted)]">
                (All {pipeline.totalCanonicalPackages} work items)
              </span>
            </h2>
          </div>
          <strong className="text-[0.76rem] font-extrabold text-[#12793f]">
            {productionPercentage}% in Production
          </strong>
        </div>

        <div
          className="mt-3 flex h-7 w-full overflow-hidden rounded-full bg-[#eef0f4]"
          role="img"
          aria-label={`Stage distribution across ${pipeline.totalCanonicalPackages} work items`}
        >
          {stages.map((stage) => {
            if (!stage.count || !pipeline.totalCanonicalPackages) return null;
            return (
              <span
                key={stage.key}
                className={cn(
                  "flex h-full min-w-[28px] items-center justify-center text-[0.6rem] font-extrabold text-white",
                  stage.bar,
                  stage.key === "not-started" && "text-[#24324f]",
                )}
                style={{
                  width: `${(stage.count / pipeline.totalCanonicalPackages) * 100}%`,
                }}
                title={`${stage.label}: ${stage.count}`}
              >
                {stage.count}
              </span>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {stages.map((stage) => (
            <span
              key={stage.key}
              className="inline-flex items-center gap-1.5 text-[0.64rem] font-semibold text-[var(--orbit-text-muted)]"
            >
              <span
                className={cn("size-2 rounded-full", stage.bar)}
                aria-hidden="true"
              />
              {stage.label} ({stage.count})
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
