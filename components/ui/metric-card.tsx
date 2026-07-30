import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "blue" | "green" | "amber" | "purple";

const toneClasses: Record<MetricTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  purple: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  className?: string;
};

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              toneClasses[tone],
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
