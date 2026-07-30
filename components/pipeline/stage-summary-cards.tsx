"use client";

import { Box, Layers, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { type WorkPackageStage } from "@/lib/projects/lifecycle.service";

interface StageSummaryCardsProps {
  total: number;
  stages: Record<WorkPackageStage, number>;
}

export function StageSummaryCards({ total, stages }: StageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <div className="stat-card flex flex-col justify-between bg-gradient-to-b from-[#171F38] to-[#0C1122] rounded-[12px] p-4 text-white shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-white/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-white/70 font-semibold">Total Work</div>
            <div className="text-[11.5px] text-white/50">All Active Items</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] leading-none">{total}</div>
      </div>

      <div className="stat-card flex flex-col justify-between bg-white rounded-[12px] p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#EEF0F4] flex items-center justify-center">
            <Box className="w-4 h-4 text-[#8A93A6]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#5B6273] font-semibold">Not Started</div>
            <div className="text-[11.5px] text-[#98A0B3]">Backlog</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] text-[#10131C] leading-none">{stages.NS || 0}</div>
      </div>

      <div className="stat-card flex flex-col justify-between bg-white rounded-[12px] p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#E3F8F4] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-[#0E9F8E]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#5B6273] font-semibold">In Progress</div>
            <div className="text-[11.5px] text-[#98A0B3]">Active Development</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] text-[#10131C] leading-none">{stages.IP || 0}</div>
      </div>

      <div className="stat-card flex flex-col justify-between bg-white rounded-[12px] p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#EFEBFF] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-[#6E5AE6]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#5B6273] font-semibold">Checking</div>
            <div className="text-[11.5px] text-[#98A0B3]">QA / Review</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] text-[#10131C] leading-none">{stages.CHK || 0}</div>
      </div>

      <div className="stat-card flex flex-col justify-between bg-white rounded-[12px] p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#FDF1DD] flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-[#E8890C]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#5B6273] font-semibold">Repair</div>
            <div className="text-[11.5px] text-[#98A0B3]">Blocked / Fixing</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] text-[#10131C] leading-none">{stages.RPR || 0}</div>
      </div>

      <div className="stat-card flex flex-col justify-between bg-white rounded-[12px] p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] border border-[#E6E8EF]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#E3F7EB] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-[#17924F]" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#5B6273] font-semibold">Live</div>
            <div className="text-[11.5px] text-[#98A0B3]">Completed</div>
          </div>
        </div>
        <div className="text-[26px] font-[800] text-[#10131C] leading-none">{stages.LIVE || 0}</div>
      </div>
    </div>
  );
}
