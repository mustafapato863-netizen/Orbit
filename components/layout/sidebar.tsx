"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  UserCircle,
  Users,
  Zap,
} from "lucide-react";

import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: SessionUser;
};

type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  tag?: string;
  activeWhen?: (pathname: string) => boolean;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const canManageAccess = hasPermission(user, PERMISSIONS.SYSTEM_MANAGE);
  const storageKey = useMemo(() => "orbit.sidebar.collapsed", []);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const openedProjectHref = getOpenedProjectHref(pathname);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(isCollapsed));
    } catch {
      // Ignore
    }
  }, [isCollapsed, storageKey]);

  const workspaceItems: NavItem[] = [
    {
      label: "Workspace",
      href: openedProjectHref,
      icon: LayoutDashboard,
      activeWhen: (p) => p === openedProjectHref,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: FolderKanban,
      activeWhen: (p) => p === "/projects" || p.startsWith("/projects/new"),
    },
  ];

  const adminItems: NavItem[] = [
    ...(canManageAccess
      ? ([
          {
            label: "Users & access",
            href: "/access",
            icon: Users,
            activeWhen: (p: string) => p.startsWith("/access"),
          },
        ] satisfies NavItem[])
      : []),
  ];

  const accountItems: NavItem[] = [
    {
      label: "Profile",
      href: "/profile",
      icon: UserCircle,
      activeWhen: (p) => p.startsWith("/profile"),
    },
  ];

  const initials = user.displayName ? user.displayName.charAt(0).toUpperCase() : "U";

  return (
    <aside
      className={cn(
        "relative sticky top-0 hidden h-svh shrink-0 flex-col border-r border-[#ffffff14] bg-[#0a0b10] p-3.5 text-[#b9bac2] transition-[width] duration-200 ease-out lg:flex overflow-hidden",
        isCollapsed ? "w-[84px]" : "w-[236px]",
      )}
    >
      {/* Light Shard Accent (Lightning Shard SVG Background) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
        <svg
          className="absolute -right-4 top-0 h-full w-[220px]"
          viewBox="0 0 220 800"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Diagonal Wedge Shard Fill (#5b3df5 at ~16% opacity) */}
          <polygon
            points="140,0 220,0 90,800 10,800"
            fill="#5b3df5"
            fillOpacity="0.16"
          />
          {/* 6px Core Line (#8b7bff at ~70% opacity with drop-shadow glow) */}
          <line
            x1="180"
            y1="0"
            x2="50"
            y2="800"
            stroke="#8b7bff"
            strokeWidth="6"
            strokeOpacity="0.7"
            style={{ filter: "drop-shadow(0 0 12px rgba(91, 61, 245, 0.5))" }}
          />
          {/* 2px Highlight Line (#c4baff at ~50% opacity) */}
          <line
            x1="182"
            y1="0"
            x2="52"
            y2="800"
            stroke="#c4baff"
            strokeWidth="2"
            strokeOpacity="0.5"
          />
        </svg>
      </div>

      {/* Header Container */}
      <div className={cn("relative z-10 pb-5 pt-1", isCollapsed ? "px-0" : "px-2")}>
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-2.5 pr-8",
          )}
        >
          {/* 28px circle background #5b3df5 with centered white lightning icon */}
          <div className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[#5b3df5] text-white shadow-2xs">
            <Zap className="size-4 fill-white text-white" />
          </div>
          {!isCollapsed ? (
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-white">Orbit</div>
              <div className="text-[11px] font-medium text-[#83848f]">Project Manager</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={isCollapsed}
          onClick={() => setIsCollapsed((current) => !current)}
          className={cn(
            "absolute right-0 top-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#ffffff14] bg-white/[0.04] text-[#83848f] transition hover:bg-white/[0.08] hover:text-white cursor-pointer",
            isCollapsed && "right-1 top-1",
          )}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={cn("relative z-10 flex-1 overflow-y-auto", isCollapsed && "px-0")}>
        <NavGroup label="Workspace" items={workspaceItems} pathname={pathname} collapsed={isCollapsed} />
        <NavGroup label="Administration" items={adminItems} pathname={pathname} collapsed={isCollapsed} />
        <NavGroup label="Account" items={accountItems} pathname={pathname} collapsed={isCollapsed} />
      </nav>

      {/* Footer / Session Area */}
      <div className={cn("relative z-10 mt-2.5 flex items-center gap-2.5 border-t border-[#ffffff14] pt-3", isCollapsed ? "justify-center px-0" : "pl-2.5 pr-1.5")}>
        <span className="size-[7px] shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
        {!isCollapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-semibold text-white">
              Secure session active
            </div>
            <div className="truncate text-[11px] text-[#83848f]">
              Workspace access is verified
            </div>
          </div>
        ) : null}
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border border-[#ffffff14] bg-white/5 text-[12px] font-bold text-white", isCollapsed && "ml-0")}>
          {initials}
        </div>
      </div>
    </aside>
  );
}

export function getOpenedProjectHref(pathname: string) {
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];

  return projectId && projectId !== "new"
    ? `/projects/${projectId}`
    : "/";
}

function NavGroup({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-1">
      {!collapsed ? (
        <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#5c5d68]">
          {label}
        </div>
      ) : null}
      {items.map((item) => (
        <NavRow key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
      ))}
    </div>
  );
}

function NavRow({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const isActive = item.activeWhen?.(pathname) ?? false;
  const isDisabled = !item.href;

  const content = (
    <>
      <Icon className={cn("size-4 shrink-0 transition-colors duration-200", isActive ? "text-[#b6acff]" : "text-[#83848f] group-hover:text-white")} />
      {!collapsed ? (
        <>
          <span className={cn("min-w-0 flex-1 truncate transition-colors duration-200", isActive ? "text-white font-semibold" : "text-[#b9bac2] group-hover:text-white")}>
            {item.label}
          </span>
          {item.tag ? (
            <span className="ml-auto shrink-0 rounded-[5px] border border-[#ffffff14] bg-white/5 px-1.5 py-0.5 text-[9px] font-bold tracking-[.04em] text-[#83848f]">
              {item.tag}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const rowClasses = cn(
    "group relative flex items-center rounded-lg py-2 text-[13.5px] font-medium transition-all duration-300 ease-out",
    collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
    isActive && "bg-[#5b3df5]/15 border-l-2 border-[#8b7bff] rounded-l-none rounded-r-lg text-white font-semibold shadow-2xs",
    !isActive && !isDisabled && "text-[#b9bac2] hover:bg-gradient-to-r hover:from-[#5b3df5]/25 hover:to-transparent hover:text-white hover:border-l-2 hover:border-[#8b7bff]/60 hover:rounded-l-none hover:rounded-r-lg",
    isDisabled && "cursor-not-allowed text-[#5c5d68]",
  );

  if (isDisabled) {
    return (
      <div className={rowClasses} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={item.href!} className={rowClasses}>
      {content}
    </Link>
  );
}
