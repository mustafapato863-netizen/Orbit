"use client";

import { type WorkPackageStage } from "@/lib/projects/lifecycle.service";

interface StageDistributionBarProps {
  total: number;
  stages: Record<WorkPackageStage, number>;
}

export function StageDistributionBar({ total, stages }: StageDistributionBarProps) {
  if (total === 0) return null;

  const getPercentage = (value: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const stageData = [
    { key: "NS" as WorkPackageStage, label: "Not Started", color: "#8A93A6", bgClass: "bg-[#8A93A6]" },
    { key: "IP" as WorkPackageStage, label: "In Progress", color: "#0E9F8E", bgClass: "bg-[#0E9F8E]" },
    { key: "CHK" as WorkPackageStage, label: "Checking", color: "#6E5AE6", bgClass: "bg-[#6E5AE6]" },
    { key: "RPR" as WorkPackageStage, label: "Repair", color: "#E8890C", bgClass: "bg-[#E8890C]" },
    { key: "LIVE" as WorkPackageStage, label: "Live", color: "#17924F", bgClass: "bg-[#17924F]" },
  ];

  return (
    <div className="w-full">
      <div className="stage-bar h-[34px] flex w-full rounded-lg overflow-hidden border border-[#E6E8EF] mb-3 bg-[#F4F5F8]">
        {stageData.map((stage) => {
          const value = stages[stage.key] || 0;
          if (value === 0) return null;
          return (
            <div
              key={stage.key}
              className={`h-full ${stage.bgClass} transition-all duration-300 border-r border-white/20 last:border-r-0`}
              style={{ width: `${getPercentage(value)}%` }}
              title={`${stage.label}: ${value}`}
            />
          );
        })}
      </div>
      
      <div className="stage-legend flex flex-wrap items-center gap-4 text-[12px] text-[#5B6273]">
        {stageData.map((stage) => {
          const value = stages[stage.key] || 0;
          return (
            <div key={stage.key} className="flex items-center gap-1.5">
              <div 
                className={`w-[8px] h-[8px] rounded-full ${stage.bgClass}`}
              />
              <span>
                <span className="font-semibold text-[#10131C]">{stage.key}</span> {stage.label} ({value})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
