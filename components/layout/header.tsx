"use client";

import { Activity, ChevronDown, LogOut } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { OrbitMark } from "@/components/layout/orbit-mark";
import type { SessionUser } from "@/lib/auth/session";

export function Header({ user }: { user: SessionUser }) {
  const initials = user.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--orbit-border)] bg-white">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <OrbitMark className="size-7 bg-[linear-gradient(180deg,#202a48,#12172a)] ring-white/10" />
          <div className="min-w-0">
            <div className="text-[14.5px] font-bold text-[var(--orbit-text)]">
              Orbit workspace
            </div>
            <div className="text-[12px] text-[var(--orbit-text-subtle)]">
              Application foundation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-[#CFEEDB] bg-[#F5FCF8] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--orbit-green)] md:inline-flex">
            <Activity className="size-[13px]" />
            System healthy
          </span>

          <div className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1 hover:bg-[var(--orbit-grey-soft)] cursor-pointer">
            <div className="flex size-[30px] items-center justify-center rounded-full bg-gradient-to-br from-[#2A3350] to-[#12172A] text-[12px] font-bold text-white">
              {initials}
            </div>
            <div className="hidden min-w-0 leading-tight sm:block">
              <div className="text-[12.5px] font-semibold text-[var(--orbit-text)]">
                {user.displayName}
              </div>
              <div className="text-[11px] text-[var(--orbit-text-subtle)]">
                {user.roleNames.join(", ") || "Project member"}
              </div>
            </div>
            <ChevronDown className="hidden size-3.5 text-[var(--orbit-text-subtle)] sm:block" />
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex size-[34px] items-center justify-center rounded-[9px] border border-transparent text-[var(--orbit-text-muted)] hover:bg-[var(--orbit-grey-soft)] cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
