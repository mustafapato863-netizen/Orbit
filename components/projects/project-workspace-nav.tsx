"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  FileText,
  Flag,
  LayoutDashboard,
  ListChecks,
  Radar,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ProjectWorkspaceNavProps = {
  projectId: string;
};

type ProjectNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: (pathname: string) => boolean;
};

export function ProjectWorkspaceNav({ projectId }: ProjectWorkspaceNavProps) {
  const pathname = usePathname();
  const projectRoot = `/projects/${projectId}`;
  const items: ProjectNavItem[] = [
    {
      label: "Overview",
      href: projectRoot,
      icon: LayoutDashboard,
      active: (value) => value === projectRoot,
    },
    {
      label: "Timeline",
      href: `${projectRoot}/pipeline`,
      icon: CalendarRange,
      active: (value) => value.startsWith(`${projectRoot}/pipeline`),
    },
    {
      label: "Milestones",
      href: `${projectRoot}/milestones`,
      icon: Flag,
      active: (value) => value.startsWith(`${projectRoot}/milestones`),
    },
    {
      label: "Plan",
      href: `${projectRoot}/workstreams`,
      icon: ListChecks,
      active: (value) =>
        value.startsWith(`${projectRoot}/workstreams`) ||
        value.startsWith(`${projectRoot}/capabilities`),
    },
    {
      label: "Risks",
      href: `${projectRoot}/risks`,
      icon: ShieldAlert,
      active: (value) =>
        value.startsWith(`${projectRoot}/risks`) ||
        value.startsWith(`${projectRoot}/decisions`),
    },
    {
      label: "Pilot",
      href: `${projectRoot}/pilot`,
      icon: Radar,
      active: (value) => value.startsWith(`${projectRoot}/pilot`),
    },
    {
      label: "Reports",
      href: `${projectRoot}/reports`,
      icon: FileText,
      active: (value) => value.startsWith(`${projectRoot}/reports`),
    },
    {
      label: "Settings",
      href: `${projectRoot}/edit`,
      icon: Settings,
      active: (value) =>
        value === `${projectRoot}/edit` ||
        value.startsWith(`${projectRoot}/members`),
    },
  ];

  return (
    <nav
      aria-label="Project workspace"
      className="sticky top-[68px] z-20 -mx-1 mb-5 overflow-x-auto rounded-xl border border-[var(--orbit-border)] bg-white/95 px-2 shadow-[var(--orbit-shadow-xs)] backdrop-blur supports-[backdrop-filter]:bg-white/90"
    >
      <div className="flex min-w-max items-center gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.active(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center gap-2 px-3 text-[0.75rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--orbit-purple)]",
                isActive
                  ? "text-[#6350c9]"
                  : "text-[var(--orbit-text-muted)] hover:text-[var(--orbit-text)]",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {item.label}
              {isActive ? (
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--orbit-purple)]"
                  aria-hidden="true"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
