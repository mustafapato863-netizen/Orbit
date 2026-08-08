"use client";

import React from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: "viewing" | "editing";
  activeSection?: string;
  isOnline?: boolean;
  lastSeenAt?: Date | null;
}

interface ActiveCollaboratorsBarProps {
  collaborators?: Collaborator[];
  className?: string;
}

export function ActiveCollaboratorsBar({
  collaborators = [],
  className,
}: ActiveCollaboratorsBarProps) {
  const activeCollaborators = collaborators.length > 0 ? collaborators : [];
  const onlineCount = activeCollaborators.filter(
    (user) => user.isOnline !== false,
  ).length;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm backdrop-blur-md",
        className,
      )}
      title="Active Project Team Collaborators"
    >
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline">Live Presence</span>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {activeCollaborators.length > 0 ? (
        <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
          {activeCollaborators.map((user) => (
            <div
              key={user.id}
              className="group relative flex items-center justify-center cursor-pointer"
            >
              <div
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-xs transition-transform group-hover:scale-110 group-hover:z-10",
                  user.color,
                )}
              >
                {user.initials}
                <span
                  className={cn(
                    "absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-white dark:ring-slate-900",
                    user.isOnline !== false
                      ? user.status === "editing"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                      : "bg-slate-400",
                  )}
                />
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-start p-2.5 rounded-lg bg-slate-900 text-white border border-slate-800 text-[11px] shadow-xl whitespace-nowrap z-50 pointer-events-none">
                <span className="font-bold">{user.name}</span>
                <span className="text-slate-300">{user.role}</span>
                <span
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[10px] font-medium",
                    user.isOnline !== false ? "text-emerald-400" : "text-slate-400",
                  )}
                >
                  <Eye className="h-3 w-3" />
                  {user.isOnline !== false
                    ? user.status === "editing"
                      ? "Editing now"
                      : "Active online"
                    : "Offline"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold pl-0.5">
        {onlineCount} {onlineCount === 1 ? "online" : "online"}
      </span>
    </div>
  );
}
