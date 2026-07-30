import type { OverviewStage } from "@/lib/pipeline/pipeline";

export const pipelineStagePresentation: Record<
  OverviewStage,
  {
    shortCode: string;
    displayLabel: string;
    description: string;
    accent: string;
    bar: string;
    dot: string;
    soft: string;
    text: string;
    contrastText: string;
  }
> = {
  NOT_STARTED: {
    shortCode: "NS",
    displayLabel: "Not Started",
    description: "Pending kickoff",
    accent: "border-l-[#b7bcc9]",
    bar: "bg-[#b7bcc9]",
    dot: "bg-[#b7bcc9]",
    soft: "bg-[#eef0f4]",
    text: "text-[#656e82]",
    contrastText: "text-[#10131c]",
  },
  IN_PROGRESS: {
    shortCode: "IP",
    displayLabel: "In Progress",
    description: "Active implementation",
    accent: "border-l-[#0e9f8e]",
    bar: "bg-[#0e9f8e]",
    dot: "bg-[#0e9f8e]",
    soft: "bg-[#e3f8f4]",
    text: "text-[#0c8e7e]",
    contrastText: "text-white",
  },
  READY_FOR_CHECK: {
    shortCode: "REV",
    displayLabel: "Under Review",
    description: "Awaiting review",
    accent: "border-l-[#6e5ae6]",
    bar: "bg-[#6e5ae6]",
    dot: "bg-[#6e5ae6]",
    soft: "bg-[#efebff]",
    text: "text-[#6350c9]",
    contrastText: "text-white",
  },
  READY_FOR_PRODUCTION: {
    shortCode: "APR",
    displayLabel: "Approved",
    description: "Approval confirmed",
    accent: "border-l-[#2f6fe4]",
    bar: "bg-[#2f6fe4]",
    dot: "bg-[#2f6fe4]",
    soft: "bg-[#e8f0fe]",
    text: "text-[#2559bd]",
    contrastText: "text-white",
  },
  LIVE: {
    shortCode: "DONE",
    displayLabel: "Completed",
    description: "Delivery complete",
    accent: "border-l-[#17924f]",
    bar: "bg-[#17924f]",
    dot: "bg-[#17924f]",
    soft: "bg-[#e3f7eb]",
    text: "text-[#12793f]",
    contrastText: "text-white",
  },
};

const STATUS_PROGRESS_PRESENTATION: Record<string, string> = {
  NOT_STARTED: "bg-[#b7bcc9]",
  IN_PROGRESS: "bg-[#2f6fe4]",
  AT_RISK: "bg-[#e8890c]",
  BLOCKED: "bg-[#e4483c]",
  COMPLETED: "bg-[#17924f]",
  CANCELLED: "bg-[#9aa1b3]",
};

export function progressBarClassForStatus(status: string) {
  return STATUS_PROGRESS_PRESENTATION[status] ?? STATUS_PROGRESS_PRESENTATION.NOT_STARTED;
}

const WORKSTREAM_PRESENTATION: Record<
  string,
  { bar: string; dot: string; label: string }
> = {
  FRONTEND: {
    bar: "bg-[#2f6fe4]",
    dot: "bg-[#2f6fe4]",
    label: "Frontend",
  },
  BACKEND: {
    bar: "bg-[#17924f]",
    dot: "bg-[#17924f]",
    label: "Backend",
  },
  DATABASE: {
    bar: "bg-[#e8890c]",
    dot: "bg-[#e8890c]",
    label: "Database",
  },
};

export function workstreamPresentation(code: string | null | undefined) {
  if (code && WORKSTREAM_PRESENTATION[code]) {
    return WORKSTREAM_PRESENTATION[code];
  }
  const generic = [
    { bar: "bg-[#7157e8]", dot: "bg-[#7157e8]" },
    { bar: "bg-[#2f6fe4]", dot: "bg-[#2f6fe4]" },
    { bar: "bg-[#17924f]", dot: "bg-[#17924f]" },
    { bar: "bg-[#e8890c]", dot: "bg-[#e8890c]" },
    { bar: "bg-[#d14b72]", dot: "bg-[#d14b72]" },
    { bar: "bg-[#0c8e7e]", dot: "bg-[#0c8e7e]" },
  ];
  const index = code
    ? [...code].reduce((total, character) => total + character.charCodeAt(0), 0) %
      generic.length
    : 0;
  return (
    code
      ? { ...generic[index]!, label: code.replaceAll("_", " ") }
      : { bar: "bg-[#9aa1b3]", dot: "bg-[#9aa1b3]", label: "Unassigned" }
  );
}
