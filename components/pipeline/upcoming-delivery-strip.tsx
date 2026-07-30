"use client";

import { ChevronRight } from "lucide-react";
import { type WorkPackageStage } from "@/lib/projects/lifecycle.service";

export interface DeliveryGate {
  id: string;
  stage: WorkPackageStage | string;
  name: string;
  date: string;
  subtitle: string;
  tagBgClass?: string;
  tagTextClass?: string;
}

interface UpcomingDeliveryStripProps {
  gates: DeliveryGate[];
}

export function UpcomingDeliveryStrip({ gates }: UpcomingDeliveryStripProps) {
  if (!gates || gates.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {gates.map((gate) => (
        <div 
          key={gate.id}
          className="gate-card bg-[#FFFFFF] rounded-[12px] p-[16px] border border-[#E6E8EF] shadow-[0_1px_2px_rgba(16,24,40,.04)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${gate.tagBgClass || 'bg-[#2F6FE4]'} ${gate.tagTextClass || 'text-white'}`}>
                {gate.stage}
              </span>
              <span className="text-[13px] font-bold text-[#10131C]">{gate.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#98A0B3]" />
          </div>
          <div>
            <div className="text-[15px] font-[800] text-[#10131C] mb-0.5">{gate.date}</div>
            <div className="text-[11.5px] text-[#98A0B3]">{gate.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
