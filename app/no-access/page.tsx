import { ArrowRight, CircleUserRound, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { OrbitMark } from "@/components/layout/orbit-mark";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f6f7fb] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(113,87,232,0.12),transparent_42%)]" aria-hidden="true" />

      <div className="relative w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          <OrbitMark className="size-10 bg-[linear-gradient(180deg,#202a48,#12172a)] ring-white/10" />
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-[#17213b]">Orbit</p>
            <p className="text-[11px] text-[#7c86a4]">Project Manager</p>
          </div>
        </div>

        <section className="rounded-3xl border border-[#e3e6ef] bg-white p-7 text-center shadow-[0_20px_60px_rgba(27,35,64,0.10)] sm:p-10" aria-labelledby="no-access-title">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#fff4e8] text-[#c47718] ring-8 ring-[#fff9f1]">
            <ShieldAlert className="size-8" aria-hidden="true" />
          </span>
          <p className="mt-7 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8a92ab]">403 · Restricted area</p>
          <h1 id="no-access-title" className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#17213b] sm:text-[1.8rem]">You don&apos;t have access to this area</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#68728e]">Your account is signed in, but its role or project membership does not include this page. Ask an Administrator to grant the required access.</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="h-10 rounded-xl px-4">
              <Link href="/profile">
                <CircleUserRound className="size-4" />
                Open profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-xl border-[#dfe3ed] px-4 text-[#39435f]">
              <Link href="/sign-in">
                Switch account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-7 text-xs text-[#9aa2b8]">If you believe this is a mistake, share the page name with your workspace Administrator.</p>
        </section>
      </div>
    </main>
  );
}
