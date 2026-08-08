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
} from "lucide-react";

import { OrbitMark } from "@/components/layout/orbit-mark";
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
        // The preference is intentionally applied after mount so the server
        // and first client render keep identical sidebar markup.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCollapsed(true);
      }
    } catch {
      // Ignore storage access failures and keep the default layout.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(isCollapsed));
    } catch {
      // Ignore storage access failures and keep the current runtime state.
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
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-[#1e293b] bg-[#0c101d] p-3.5 text-slate-300 transition-[width] duration-200 ease-out lg:flex",
        isCollapsed ? "w-[84px]" : "w-[236px]",
      )}
    >
      <div className={cn("relative pb-5 pt-1", isCollapsed ? "px-0" : "px-2")}>
        <div
          className={cn(
            "flex items-start",
            isCollapsed ? "justify-center" : "gap-2.5 pr-10",
          )}
        >
          <OrbitMark />
          {!isCollapsed ? (
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-slate-100">Orbit</div>
              <div className="text-[11.5px] text-slate-400 font-medium">Project Manager</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={isCollapsed}
          onClick={() => setIsCollapsed((current) => !current)}
          className={cn(
            "absolute right-0 top-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#1e293b] bg-slate-800/40 text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer",
            isCollapsed && "right-1 top-1",
          )}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className={cn("flex-1 overflow-y-auto", isCollapsed && "px-0")}>
        <NavGroup label="Workspace" items={workspaceItems} pathname={pathname} collapsed={isCollapsed} />
        <NavGroup label="Administration" items={adminItems} pathname={pathname} collapsed={isCollapsed} />
        <NavGroup label="Account" items={accountItems} pathname={pathname} collapsed={isCollapsed} />
      </nav>

      <div className={cn("mt-2.5 flex items-center gap-2.5 border-t border-[#1e293b] pt-3", isCollapsed ? "justify-center px-0" : "pl-2.5 pr-1.5")}>
        <span className="size-[7px] shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
        {!isCollapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-semibold text-slate-200">
              Secure session active
            </div>
            <div className="truncate text-[11px] text-slate-400">
              Workspace access is verified
            </div>
          </div>
        ) : null}
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border border-[#1e293b] bg-slate-800 text-[12px] font-bold text-slate-100", isCollapsed && "ml-0")}>
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
        <div className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">
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
      <Icon className={cn("size-4 shrink-0", isActive ? "text-purple-400" : "text-slate-400")} />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.tag ? (
            <span className="ml-auto shrink-0 rounded-[5px] border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold tracking-[.04em] text-slate-400">
              {item.tag}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const rowClasses = cn(
    "relative flex items-center rounded-lg py-2 text-[13.5px] font-medium transition-all",
    collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
    isActive && "bg-purple-500/15 text-white font-semibold border-l-2 border-purple-500 shadow-2xs",
    !isActive && !isDisabled && "text-slate-300 hover:bg-slate-800/60 hover:text-white",
    isDisabled && "cursor-not-allowed text-slate-600",
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
