import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  rows?: number;
  className?: string;
};

export function LoadingState({
  label = "Loading workspace",
  rows = 3,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("rounded-xl border bg-card p-5", className)}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin text-primary"
        />
        {label}
      </div>
      <div aria-hidden="true" className="mt-5 space-y-3">
        {Array.from({ length: Math.max(1, rows) }, (_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
