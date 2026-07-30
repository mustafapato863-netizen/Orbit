"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type BreadcrumbsProps = {
  customEyebrow?: string;
  className?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SEGMENT_LABELS: Record<string, string> = {
  projects: "PROJECTS",
  pipeline: "DELIVERY",
  capabilities: "CAPABILITIES",
  workstreams: "WORKSTREAMS",
  risks: "RISKS",
  reports: "REPORTS",
  pilot: "PILOT",
  members: "MEMBERS",
  milestones: "MILESTONES",
  edit: "EDIT",
  new: "NEW",
  settings: "SETTINGS",
  access: "ACCESS",
};

export function Breadcrumbs({ customEyebrow, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const customParts = customEyebrow
    ? customEyebrow
        .replace(/[·•]/g, "/")
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-[11.5px] font-bold tracking-[.06em] uppercase text-[var(--orbit-text-subtle)]",
        className,
      )}
    >
      {pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const customPartIndex = pathSegments
          .slice(0, index)
          .filter((value) => UUID_REGEX.test(value)).length;

        let label: string;
        if (UUID_REGEX.test(segment)) {
          label = customParts[customPartIndex] || "PMS";
        } else {
          label =
            SEGMENT_LABELS[segment] ||
            segment.replace(/-/g, " ").toUpperCase();
        }

        return (
          <span key={href}>
            {index > 0 ? <span className="mx-1.5 opacity-60">/</span> : null}
            {isLast ? (
              <span className="font-extrabold text-[var(--orbit-purple)]">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="cursor-pointer hover:text-[var(--orbit-text)]"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
