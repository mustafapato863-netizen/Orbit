"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Puzzle, Maximize2 } from "lucide-react";
import type { WorkPackageStage } from "@/lib/projects/lifecycle.service";

// Assume WorkPackageDetailDrawer is available in a standard location, e.g.
import { WorkPackageDetailDrawer } from "@/components/projects/work-package-detail-drawer";

export type WorkItem = {
  id: string;
  code: string;
  title: string;
  stage: WorkPackageStage;
  isShared?: boolean;
  // Representing the visual layout in the Gantt for simplicity
  segments: { stage: WorkPackageStage; widthPercent: number }[];
  diamondStage?: WorkPackageStage;
  diamondPositionPercent?: number;
};

export type MilestoneGanttGroup = {
  id: string;
  title: string;
  code: string;
  stage: WorkPackageStage;
  workItems: WorkItem[];
};

export type MilestoneRoadmapGanttProps = {
  groups: MilestoneGanttGroup[];
};

const STAGE_COLORS: Record<WorkPackageStage, string> = {
  NS: "#9AA1B3",
  IP: "#0E9F8E",
  CHK: "#6E5AE6",
  RPR: "#E8890C",
  LIVE: "#17924F",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MilestoneRoadmapGantt({ groups }: MilestoneRoadmapGanttProps) {
  // Accordion pattern (one milestone expanded at a time), but we also have "Expand all"
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedWorkPackageId, setSelectedWorkPackageId] = useState<string | null>(null);

  const toggleGroup = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Enforce accordion pattern by clearing others, unless we want to allow multiple.
        // If "accordion pattern" strictly means one at a time, we clear. 
        // But "Expand all" implies we can have multiple. 
        // We will stick to strict accordion on toggle, and open all on "Expand all".
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(groups.map((g) => g.id)));
  };

  return (
    <div className="bg-white border border-[#E6E8EF] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,.04)] overflow-hidden font-sans">
      {/* Panel head */}
      <div className="flex justify-between items-center py-[16px] px-[18px] border-b border-[#EEF0F5]">
        <h2 className="text-[#10131C] text-[14.5px] font-[700]">Milestone Roadmap</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Object.entries(STAGE_COLORS).map(([stage, color]) => (
              <div key={stage} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-[#5B6273] font-[600]">{stage}</span>
              </div>
            ))}
          </div>
          <button
            onClick={expandAll}
            className="text-[12px] font-[600] text-[#2F6FE4] hover:underline"
          >
            Expand all
          </button>
          <button className="text-[#98A0B3] hover:text-[#5B6273] transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Timeline container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header */}
          <div className="grid grid-cols-[260px_1fr] border-b border-[#EEF0F5]">
            <div className="p-3"></div>
            <div className="grid grid-cols-12 relative">
              {MONTHS.map((month) => (
                <div
                  key={month}
                  className="p-3 text-[10.5px] font-[700] uppercase tracking-wide text-[#98A0B3] text-center border-l border-[#EEF0F5]/50 first:border-transparent"
                >
                  {month}
                </div>
              ))}
              {/* TODAY Overlay */}
              <div
                className="absolute top-0 bottom-0 z-10"
                style={{
                  left: "45%", // Arbitrary position for TODAY line
                  borderLeft: "2px dashed #E8890C",
                }}
              >
                <div className="absolute -top-3 left-[-16px] bg-[#E8890C] text-white text-[9px] font-[800] px-1 rounded">
                  TODAY
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-2 flex flex-col gap-1 relative">
            {groups.map((group) => {
              const isExpanded = expandedIds.has(group.id);

              return (
                <div key={group.id} className="flex flex-col gap-1">
                  {/* Milestone Row */}
                  <div
                    className="milestone-row flex items-center gap-[9px] p-[12px_10px] rounded-lg cursor-pointer hover:bg-[#F4F5F8] transition-colors"
                    onClick={() => toggleGroup(group.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} color="#98A0B3" />
                    ) : (
                      <ChevronRight size={14} color="#98A0B3" />
                    )}
                    <span className="bg-[#EFEBFF] text-[#6350C9] text-[11px] font-[800] px-[7px] py-[2px] rounded-[6px]">
                      {group.code}
                    </span>
                    <span className="text-[13.5px] font-[700] text-[#10131C] flex-1 truncate">
                      {group.title}
                    </span>
                    <span
                      className="text-[10px] font-[800] text-white px-[8px] py-[3px] rounded-[6px]"
                      style={{ backgroundColor: STAGE_COLORS[group.stage] || STAGE_COLORS.NS }}
                    >
                      {group.stage}
                    </span>
                  </div>

                  {/* Work Items (Expanded) */}
                  {isExpanded && (
                    <div className="flex flex-col gap-1 mt-1 mb-2">
                      {group.workItems.map((wi) => (
                        <div key={wi.id} className="wi-row grid grid-cols-[260px_1fr] group">
                          {/* Left Column */}
                          <div className="pl-[34px] pr-2 py-2 flex items-center gap-2">
                            {wi.isShared && <Puzzle size={12} className="text-[#98A0B3] min-w-max" />}
                            <span
                              className="text-[12px] font-[500] text-[#5B6273] truncate cursor-pointer hover:text-[#2F6FE4]"
                              onClick={() => setSelectedWorkPackageId(wi.id)}
                            >
                              {wi.title}
                            </span>
                          </div>

                          {/* Right Column (Gantt Cell) */}
                          <div className="gantt-cell relative h-[32px] flex items-center border-l border-[#EEF0F5]/50 group-hover:bg-[#F4F5F8]/50 transition-colors">
                            {/* Gantt Line */}
                            <div className="gantt-line absolute w-full h-[4px] flex rounded-full overflow-hidden top-1/2 -translate-y-1/2">
                              {wi.segments.map((seg, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    width: `${seg.widthPercent}%`,
                                    backgroundColor: STAGE_COLORS[seg.stage] || STAGE_COLORS.NS,
                                  }}
                                />
                              ))}
                            </div>

                            {/* Gantt Diamond */}
                            {wi.diamondPositionPercent !== undefined && wi.diamondStage && (
                              <div
                                className="gantt-diamond absolute w-[14px] h-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center shadow-sm z-10"
                                style={{
                                  left: `calc(${wi.diamondPositionPercent}% - 7px)`,
                                  backgroundColor: STAGE_COLORS[wi.diamondStage],
                                  border: "2px solid white",
                                  transform: "rotate(45deg)",
                                }}
                              >
                                <span
                                  className="text-white font-[800] text-[7.5px] leading-none"
                                  style={{ transform: "rotate(-45deg)" }}
                                >
                                  {wi.diamondStage === "LIVE" ? "L" : wi.diamondStage.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <WorkPackageDetailDrawer
        workPackageId={selectedWorkPackageId!}
        isOpen={!!selectedWorkPackageId}
        onClose={() => setSelectedWorkPackageId(null)}
      />
    </div>
  );
}
