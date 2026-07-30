import { ShieldCheck, ShieldMinus, ShieldX, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

const riskConfig = {
  none: {
    label: "No risk",
    icon: ShieldCheck,
    classes:
      "border-border bg-muted text-muted-foreground dark:bg-muted/60",
  },
  low: {
    label: "Low risk",
    icon: ShieldCheck,
    classes:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  medium: {
    label: "Medium risk",
    icon: ShieldMinus,
    classes:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  high: {
    label: "High risk",
    icon: TriangleAlert,
    classes:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  },
  critical: {
    label: "Critical risk",
    icon: ShieldX,
    classes:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
} satisfies Record<
  RiskLevel,
  { label: string; icon: typeof ShieldCheck; classes: string }
>;

type RiskBadgeProps = {
  level: RiskLevel;
  className?: string;
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];
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
      {config.label}
    </span>
  );
}
