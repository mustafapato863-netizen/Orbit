"use client";

import React from "react";
import { Filter, AlertTriangle, Flame, Clock, Code, Server, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type PMFilterPreset =
  | "ALL"
  | "RELEASE_1_BLOCKERS"
  | "HIGH_RISK"
  | "FRONTEND"
  | "BACKEND"
  | "DATABASE"
  | "DUE_SOON";

interface SavedFilterPresetsBarProps {
  activePreset: PMFilterPreset;
  onSelectPreset: (preset: PMFilterPreset) => void;
  counts?: {
    all?: number;
    blockers?: number;
    highRisk?: number;
    frontend?: number;
    backend?: number;
    database?: number;
    dueSoon?: number;
  };
  className?: string;
}

export function SavedFilterPresetsBar({
  activePreset,
  onSelectPreset,
  counts,
  className,
}: SavedFilterPresetsBarProps) {
  const presets: Array<{
    id: PMFilterPreset;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    variant: "default" | "destructive" | "warning" | "info" | "secondary";
  }> = [
    {
      id: "ALL",
      label: "All Items",
      icon: Layers,
      badgeCount: counts?.all,
      variant: "secondary",
    },
    {
      id: "RELEASE_1_BLOCKERS",
      label: "Release 1 Blockers",
      icon: AlertTriangle,
      badgeCount: counts?.blockers,
      variant: "destructive",
    },
    {
      id: "HIGH_RISK",
      label: "High Risk",
      icon: Flame,
      badgeCount: counts?.highRisk,
      variant: "warning",
    },
    {
      id: "FRONTEND",
      label: "Frontend",
      icon: Code,
      badgeCount: counts?.frontend,
      variant: "info",
    },
    {
      id: "BACKEND",
      label: "Backend",
      icon: Server,
      badgeCount: counts?.backend,
      variant: "info",
    },
    {
      id: "DATABASE",
      label: "Database",
      icon: Database,
      badgeCount: counts?.database,
      variant: "info",
    },
    {
      id: "DUE_SOON",
      label: "Due Next 14d",
      icon: Clock,
      badgeCount: counts?.dueSoon,
      variant: "secondary",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-400">
        <Filter className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden sm:inline">PM Presets:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 border whitespace-nowrap",
                isActive
                  ? "bg-blue-600/90 text-white border-blue-500 shadow-sm ring-1 ring-blue-400/50"
                  : "bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isActive
                    ? "text-white"
                    : preset.variant === "destructive"
                    ? "text-rose-400"
                    : preset.variant === "warning"
                    ? "text-amber-400"
                    : "text-slate-400"
                )}
              />
              <span>{preset.label}</span>
              {typeof preset.badgeCount === "number" && preset.badgeCount > 0 && (
                <span
                  className={cn(
                    "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-blue-950 text-blue-100"
                      : preset.variant === "destructive"
                      ? "bg-rose-950/80 text-rose-300 border border-rose-800/50"
                      : preset.variant === "warning"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                      : "bg-slate-700 text-slate-200"
                  )}
                >
                  {preset.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
