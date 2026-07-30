import {
  Ban,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type Status =
  | "completed"
  | "in-progress"
  | "at-risk"
  | "blocked"
  | "not-started";

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  "in-progress": {
    label: "In progress",
    icon: CircleDot,
    classes:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  },
  "at-risk": {
    label: "At risk",
    icon: TriangleAlert,
    classes:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  blocked: {
    label: "Blocked",
    icon: Ban,
    classes:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
  "not-started": {
    label: "Not started",
    icon: CircleDashed,
    classes:
      "border-border bg-muted text-muted-foreground dark:bg-muted/60",
  },
} satisfies Record<
  Status,
  { label: string; icon: typeof CheckCircle2; classes: string }
>;

type StatusBadgeProps = {
  status: Status;
  label?: string;
  className?: string;
};

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        config.classes,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label ?? config.label}
    </span>
  );
}
