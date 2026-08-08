"use client";

import { Layers, PlusCircle } from "lucide-react";
import { useState } from "react";

import { BatchWorkItemsForm } from "@/components/execution/batch-work-items-form";
import { WorkItemForm } from "@/components/execution/work-item-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkstreamOption = {
  id: string;
  code: string;
  name: string;
  colorToken: string;
};

type MemberOption = {
  user: { id: string; displayName: string; email: string };
};

export function NewWorkItemContainer({
  projectId,
  milestoneId,
  workstreams,
  members,
}: {
  projectId: string;
  milestoneId: string;
  workstreams: WorkstreamOption[];
  members: MemberOption[];
}) {
  const [mode, setMode] = useState<"single" | "batch">("single");

  return (
    <div className="space-y-6">
      {/* Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-2xs dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              mode === "single"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <PlusCircle className="size-4" />
            <span>Single Sub-Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              mode === "batch"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <Layers className="size-4" />
            <span>Add Group of Sub-Milestones (Batch)</span>
          </button>
        </div>

        <div className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400 pr-2">
          {mode === "single"
            ? "Create one detailed work item with full acceptance criteria"
            : "Add multiple sub-milestones at once from one screen"}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "single"
              ? "Work Item details"
              : "Batch Group Creation — Sub-Milestones List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "single" ? (
            <WorkItemForm
              projectId={projectId}
              milestoneId={milestoneId}
              workstreams={workstreams}
              members={members}
            />
          ) : (
            <BatchWorkItemsForm
              projectId={projectId}
              milestoneId={milestoneId}
              workstreams={workstreams}
              members={members}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
