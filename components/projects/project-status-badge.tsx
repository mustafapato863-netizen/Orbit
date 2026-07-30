import { StatusBadge, type Status } from "@/components/ui/status-badge";

const statusMap: Record<string, Status> = {
  PLANNING: "not-started",
  ACTIVE: "in-progress",
  ON_HOLD: "at-risk",
  AT_RISK: "at-risk",
  COMPLETED: "completed",
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  BLOCKED: "blocked",
  ARCHIVED: "not-started",
};

export function ProjectStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return <StatusBadge status={statusMap[status] ?? "not-started"} label={label} />;
}
