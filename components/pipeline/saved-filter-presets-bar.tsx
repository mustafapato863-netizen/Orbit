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
        "flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">PM Presets:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/25"
                  : "bg-slate-100/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isActive
                    ? "text-white"
                    : preset.variant === "destructive"
                    ? "text-rose-600 dark:text-rose-400"
                    : preset.variant === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
                )}
              />
              <span>{preset.label}</span>
              {typeof preset.badgeCount === "number" && preset.badgeCount > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none",
                    isActive
                      ? "bg-white/25 text-white"
                      : preset.variant === "destructive"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                      : preset.variant === "warning"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                      : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
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
