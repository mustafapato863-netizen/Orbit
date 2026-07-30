"use client";

import { ArrowLeft, FolderOpen, SearchX } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type MissingContext = {
  title: string;
  description: string;
};

function missingContext(pathname: string): MissingContext {
  if (pathname.includes("/milestones/")) {
    return {
      title: "Milestone not found",
      description:
        "This milestone may have been archived, deleted, or belongs to another project.",
    };
  }
  if (pathname.includes("/work-items/")) {
    return {
      title: "Work item not found",
      description:
        "This work item is no longer available or does not belong to the selected milestone.",
    };
  }
  if (pathname.includes("/capabilities/")) {
    return {
      title: "Shared work not found",
      description:
        "This shared work record may have been archived or is not part of this project.",
    };
  }
  if (pathname.includes("/workstreams/")) {
    return {
      title: "Workstream not found",
      description:
        "This workstream may have been archived or is not configured for this project.",
    };
  }
  if (pathname.includes("/projects/")) {
    return {
      title: "Project page not found",
      description:
        "The requested page or record is unavailable. It may have been moved or archived.",
    };
  }
  return {
    title: "Page not found",
    description:
      "The address may be incorrect, or the page may have been moved or removed.",
  };
}

export function NotFoundPanel() {
  const pathname = usePathname();
  const params = useParams<{ projectId?: string }>();
  const context = missingContext(pathname);
  const projectId =
    typeof params.projectId === "string" ? params.projectId : null;
  const projectHref = projectId ? `/projects/${projectId}` : "/projects";

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-[var(--orbit-border)] bg-white p-8 text-center shadow-[var(--orbit-shadow-sm)]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[var(--orbit-surface-muted)] text-[var(--orbit-text-muted)]">
          <SearchX className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--orbit-purple)]">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--orbit-text)]">
          {context.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--orbit-text-muted)]">
          {context.description}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">
              <ArrowLeft />
              All projects
            </Link>
          </Button>
          {projectId ? (
            <Button asChild>
              <Link href={projectHref}>
                <FolderOpen />
                Project overview
              </Link>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
