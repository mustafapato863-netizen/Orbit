"use client";

import {
  CalendarDays,
  CheckCircle2,
  ListTodo,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIGHLIGHTS_VERSION = "orbit_seen_feature_highlights_v2.4";

type FeatureHighlight = {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  badge: string;
  badgeColor: string;
};

const FEATURES: FeatureHighlight[] = [
  {
    id: "live-presence",
    title: "Real Live Presence & Online Status",
    description:
      "Track active team members online in real-time on your project board and inspect exact formatted last login dates in User Management.",
    icon: Users,
    badge: "Live",
    badgeColor:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "owner-reassign",
    title: "Task Owner & Milestone Reassignment",
    description:
      "Reassign task owners and move work items between milestones directly from the Timeline Roadmap quick editor.",
    icon: UserCheck,
    badge: "New",
    badgeColor:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-600/30 dark:bg-purple-950 dark:text-purple-300",
  },
  {
    id: "duration-calculator",
    title: "Duration (Days) Calculator",
    description:
      "Set task duration in days with auto-calculating start and due dates across projects, milestones, and sub-milestones.",
    icon: CalendarDays,
    badge: "New",
    badgeColor:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-600/30 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    id: "header-todo",
    title: "Header Quick To-Do & Personal Notes",
    description:
      "Take personal notes and manage task priorities directly from the fixed header icon, saved securely in browser local storage.",
    icon: ListTodo,
    badge: "New",
    badgeColor:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/30 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    id: "lockout-reset",
    title: "Admin Lockout Timer Reset",
    description:
      "Zero out unsuccessful sign-in attempt lockout timers in User Management so users can retry immediately.",
    icon: RotateCcw,
    badge: "Enhanced",
    badgeColor:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    id: "pm-presets",
    title: "PM Filter Presets & Dashboard Contrast",
    description:
      "One-click PM presets to isolate Blocked items, Under Review tasks, or Phase 2 release items with enhanced dark/light contrast.",
    icon: SlidersHorizontal,
    badge: "Enhanced",
    badgeColor:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-400/30 dark:bg-slate-800 dark:text-slate-300",
  },
];

export function FeatureHighlightsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnseenUpdates, setHasUnseenUpdates] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(HIGHLIGHTS_VERSION);
      if (!seen) {
        setHasUnseenUpdates(true);
        // Automatically pop up for users after login
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(HIGHLIGHTS_VERSION, "true");
      setHasUnseenUpdates(false);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      {/* Header Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-all cursor-pointer",
          hasUnseenUpdates
            ? "border-amber-300 bg-amber-50 text-amber-900 shadow-2xs hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-200"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
        )}
        title="What's New in Orbit"
        aria-label="What's New in Orbit"
      >
        <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
        <span className="hidden sm:inline">What&apos;s new</span>
        {hasUnseenUpdates && (
          <span className="flex size-2 rounded-full bg-amber-500" />
        )}
      </button>

      {/* Highlights Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/30 dark:via-purple-950/10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      What&apos;s New in Orbit
                    </h2>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[0.625rem] font-extrabold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      v2.4 Release
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Discover the latest features and platform enhancements
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Feature Cards Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEATURES.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-400">
                              <IconComponent className="size-4" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              {feature.title}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[0.5625rem] font-bold shrink-0",
                              feature.badgeColor,
                            )}
                          >
                            {feature.badge}
                          </span>
                        </div>
                        <p className="text-[0.72rem] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>All systems operational</span>
              </div>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-5 h-9 rounded-xl shadow-md cursor-pointer"
              >
                Got it, Let&apos;s Explore!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
