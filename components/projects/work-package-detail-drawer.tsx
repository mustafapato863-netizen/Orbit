"use client";

import { ChevronRight, X } from "lucide-react";
import { type WorkPackageStage, WORK_PACKAGE_STAGES } from "@/lib/projects/lifecycle.service";

type WorkPackageDetailDrawerProps = {
  workPackageId: string;
  isOpen: boolean;
  onClose: () => void;
};

const STAGE_COLORS: Record<WorkPackageStage, string> = {
  NS: "#9AA1B3",
  IP: "#0E9F8E",
  CHK: "#6E5AE6",
  RPR: "#E8890C",
  LIVE: "#17924F",
};

export function WorkPackageDetailDrawer({
  workPackageId,
  isOpen,
  onClose,
}: WorkPackageDetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-[440px] max-w-[90vw] bg-white border-l border-[#E6E8EF] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEF0F5] px-5 py-4">
          <h3 className="text-[14.5px] font-bold text-[#10131C]">
            Work Package Details
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#98A0B3] hover:bg-[#EEF0F4] hover:text-[#5B6273] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 h-[calc(100%-57px)]">
          <div className="text-[12px] text-[#98A0B3] font-bold tracking-wider uppercase mb-2">
            Package ID
          </div>
          <div className="text-[14px] font-semibold text-[#10131C] mb-5">
            {workPackageId}
          </div>

          {/* Stage Journey */}
          <div className="text-[12px] text-[#98A0B3] font-bold tracking-wider uppercase mb-3">
            Delivery Journey
          </div>
          <div className="flex flex-col gap-1 mb-5">
            {(["NS", "IP", "CHK", "RPR", "LIVE"] as WorkPackageStage[]).map(
              (stage, idx) => {
                const info = WORK_PACKAGE_STAGES[stage];
                return (
                  <div
                    key={stage}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F4F5F8]"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STAGE_COLORS[stage] }}
                    />
                    <span className="text-[12.5px] font-semibold text-[#5B6273]">
                      {info?.label || stage}
                    </span>
                    {idx < 4 && (
                      <ChevronRight
                        size={11}
                        className="text-[#98A0B3] ml-auto"
                      />
                    )}
                  </div>
                );
              },
            )}
          </div>

          <div className="text-[11px] text-[#98A0B3] text-center pt-4 border-t border-[#EEF0F5]">
            Detailed editing coming soon
          </div>
        </div>
      </div>
    </>
  );
}
