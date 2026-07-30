"use client";

import { Download, FileSpreadsheet, LoaderCircle, Presentation, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReportDownloadButton({
  projectId,
  format,
}: {
  projectId: string;
  format: "powerpoint" | "excel";
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const isPowerPoint = format === "powerpoint";
  const Icon = isPowerPoint ? Presentation : FileSpreadsheet;

  async function download() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/reports/${format}`, {
        method: "POST",
        headers: { Accept: isPowerPoint ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "The report could not be generated.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `orbit-management-report.${isPowerPoint ? "pptx" : "xlsx"}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The report could not be generated.");
      setState("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={download} disabled={state === "loading"} className="w-full sm:w-auto" variant={isPowerPoint ? "default" : "outline"}>
        {state === "loading" ? <LoaderCircle className="animate-spin" /> : <Icon />}
        {state === "loading" ? "Generating…" : `Download ${isPowerPoint ? "PowerPoint" : "Excel pack"}`}
        {state !== "loading" ? <Download /> : null}
      </Button>
      <p aria-live="polite" className="max-w-sm text-xs text-destructive">
        {state === "error" ? <span className="inline-flex items-center gap-1"><TriangleAlert className="size-3" />{message}</span> : null}
      </p>
    </div>
  );
}
