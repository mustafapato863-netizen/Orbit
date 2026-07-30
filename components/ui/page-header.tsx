import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-[22px]", className)}>
      {eyebrow ? (
        <div className="mb-[10px]">
          <Breadcrumbs customEyebrow={eyebrow} />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--orbit-text)] m-0 mb-1.5">
            {title}
          </h1>
          {description ? (
            <p className="max-w-[640px] text-[13.5px] leading-relaxed text-[var(--orbit-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
