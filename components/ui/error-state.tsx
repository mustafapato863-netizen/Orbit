import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "The workspace could not be loaded. Try again or contact support if the problem continues.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <TriangleAlert aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
