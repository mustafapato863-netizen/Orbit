"use client";

import { LoaderCircle, Plus, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createBatchWorkItemsAction } from "@/app/(workspace)/projects/execution-actions";
import { selectClasses } from "@/components/projects/form-controls";
import { Button } from "@/components/ui/button";
import { GooeyButton } from "@/components/ui/gooey-button";
import { executionRiskLevels } from "@/lib/execution/execution.schemas";
import { displayEnum } from "@/lib/projects/project.utils";
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

export type BatchWorkItemRow = {
  id: string;
  name: string;
  primaryWorkstreamId: string;
  startDate: string;
  durationDays: string;
  dueDate: string;
  ownerId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export function BatchWorkItemsForm({
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createInitialRow = (): BatchWorkItemRow => ({
    id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: "",
    primaryWorkstreamId: workstreams[0]?.id ?? "",
    startDate: "",
    durationDays: "7",
    dueDate: "",
    ownerId: "",
    riskLevel: "LOW",
  });

  const [rows, setRows] = useState<BatchWorkItemRow[]>([
    createInitialRow(),
    { ...createInitialRow(), id: `row-2-${Date.now()}` },
    { ...createInitialRow(), id: `row-3-${Date.now()}` },
  ]);

  const handleAddRow = () => {
    setRows((prev) => [...prev, createInitialRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) {
      setErrorMessage("At least one sub-milestone item is required.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRowField = <K extends keyof BatchWorkItemRow>(
    id: string,
    field: K,
    value: BatchWorkItemRow[K],
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // Handle auto date calculation for duration
        if (field === "startDate" || field === "durationDays") {
          const start = field === "startDate" ? (value as string) : row.startDate;
          const durationStr = field === "durationDays" ? (value as string) : row.durationDays;
          if (start && durationStr) {
            const days = parseInt(durationStr, 10);
            if (!isNaN(days) && days >= 0) {
              const d = new Date(start);
              d.setDate(d.getDate() + days);
              updated.dueDate = d.toISOString().split("T")[0];
            }
          }
        } else if (field === "dueDate") {
          const due = value as string;
          if (row.startDate && due) {
            const d1 = new Date(row.startDate);
            const d2 = new Date(due);
            const diffTime = d2.getTime() - d1.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) updated.durationDays = String(diffDays);
          }
        }

        return updated;
      }),
    );
  };

  const [rowErrors, setRowErrors] = useState<Record<number, { name?: string; startDate?: string; dueDate?: string }>>({});

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRowErrors({});

    const newRowErrors: Record<number, { name?: string; startDate?: string; dueDate?: string }> = {};
    let firstErrorMsg = "";

    // Detailed client-side row validation
    rows.forEach((r, idx) => {
      const errors: { name?: string; startDate?: string; dueDate?: string } = {};
      if (!r.name || r.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters.";
        if (!firstErrorMsg) firstErrorMsg = `Row #${idx + 1}: Name must be at least 2 characters.`;
      }
      if (r.startDate && r.dueDate) {
        if (new Date(r.startDate) > new Date(r.dueDate)) {
          errors.startDate = "Start date cannot be after due date.";
          errors.dueDate = "Due date must be on or after start date.";
          if (!firstErrorMsg)
            firstErrorMsg = `Row #${idx + 1}: Start date cannot be after due date.`;
        }
      }
      if (Object.keys(errors).length > 0) {
        newRowErrors[idx] = errors;
      }
    });

    if (Object.keys(newRowErrors).length > 0) {
      setRowErrors(newRowErrors);
      setErrorMessage(firstErrorMsg || "Please fix the highlighted row issues.");
      return;
    }

    startTransition(async () => {
      const itemsPayload = rows.map((r) => ({
        projectId,
        milestoneId,
        name: r.name.trim(),
        primaryWorkstreamId: r.primaryWorkstreamId,
        supportingWorkstreamIds: [],
        status: "NOT_STARTED" as const,
        progress: 0,
        deliveryStage: "NOT_STARTED" as const,
        nextGate: "",
        startDate: r.startDate ? r.startDate : "",
        dueDate: r.dueDate ? r.dueDate : "",
        ownerId: r.ownerId ? r.ownerId : "",
        riskLevel: r.riskLevel,
        blocker: "",
        notes: "",
        acceptanceCriteria: "",
      }));

      const result = await createBatchWorkItemsAction({
        projectId,
        milestoneId,
        items: itemsPayload,
      });

      if (!result.success) {
        setErrorMessage(
          result.message ?? "Failed to save sub-milestones batch. Please check row entries.",
        );
        return;
      }

      if (result.redirectTo) router.push(result.redirectTo);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmitBatch} className="space-y-6" noValidate>
      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 min-w-[200px]">Sub-Milestone Name *</th>
              <th className="p-3 min-w-[150px]">Workstream</th>
              <th className="p-3 min-w-[130px]">Start Date</th>
              <th className="p-3 min-w-[110px]">Duration (Days)</th>
              <th className="p-3 min-w-[130px]">Due Date</th>
              <th className="p-3 min-w-[140px]">Owner</th>
              <th className="p-3 min-w-[110px]">Risk</th>
              <th className="p-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => {
              const errs = rowErrors[index];
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    errs
                      ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
                  )}
                >
                  <td className="p-3 text-center font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="e.g. Database schema setup"
                      value={row.name}
                      onChange={(e) => updateRowField(row.id, "name", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100",
                        errs?.name
                          ? "border-rose-500 ring-2 ring-rose-500/30 dark:border-rose-500"
                          : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700",
                      )}
                    />
                    {errs?.name && (
                      <p className="mt-0.5 text-[0.625rem] font-semibold text-rose-600 dark:text-rose-400">
                        {errs.name}
                      </p>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      value={row.primaryWorkstreamId}
                      onChange={(e) =>
                        updateRowField(row.id, "primaryWorkstreamId", e.target.value)
                      }
                      className={selectClasses}
                    >
                      {workstreams.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={row.startDate}
                      onChange={(e) => updateRowField(row.id, "startDate", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                        errs?.startDate
                          ? "border-rose-500 ring-2 ring-rose-500/30 dark:border-rose-500"
                          : "border-slate-200 dark:border-slate-700",
                      )}
                    />
                    {errs?.startDate && (
                      <p className="mt-0.5 text-[0.625rem] font-semibold text-rose-600 dark:text-rose-400">
                        {errs.startDate}
                      </p>
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Days"
                      value={row.durationDays}
                      onChange={(e) =>
                        updateRowField(row.id, "durationDays", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => updateRowField(row.id, "dueDate", e.target.value)}
                      className={cn(
                        "w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                        errs?.dueDate
                          ? "border-rose-500 ring-2 ring-rose-500/30 dark:border-rose-500"
                          : "border-slate-200 dark:border-slate-700",
                      )}
                    />
                    {errs?.dueDate && (
                      <p className="mt-0.5 text-[0.625rem] font-semibold text-rose-600 dark:text-rose-400">
                        {errs.dueDate}
                      </p>
                    )}
                  </td>
                <td className="p-2">
                  <select
                    value={row.ownerId}
                    onChange={(e) => updateRowField(row.id, "ownerId", e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Unassigned</option>
                    {members.map(({ user }) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={row.riskLevel}
                    onChange={(e) =>
                      updateRowField(
                        row.id,
                        "riskLevel",
                        e.target.value as BatchWorkItemRow["riskLevel"],
                      )
                    }
                    className={selectClasses}
                  >
                    {executionRiskLevels.map((risk) => (
                      <option key={risk} value={risk}>
                        {displayEnum(risk)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRow}
          className="gap-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40 cursor-pointer"
        >
          <Plus className="size-4" />
          Add Another Sub-Milestone
        </Button>

        <GooeyButton
          type="submit"
          variant="purple"
          disabled={isPending}
          icon={
            isPending ? (
              <LoaderCircle className="animate-spin size-4" />
            ) : (
              <Zap className="size-4 fill-white text-white" />
            )
          }
          className="px-6 py-2.5 text-xs font-bold"
        >
          {isPending ? "Submitting..." : "Submit"}
        </GooeyButton>
      </div>
    </form>
  );
}
