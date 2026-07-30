import { cn } from "@/lib/utils";

type OrbitMarkProps = {
  className?: string;
};

export function OrbitMark({ className }: OrbitMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15",
        className,
      )}
    >
      <span className="absolute size-4 rounded-full border border-sky-300/80" />
      <span className="absolute h-2.5 w-7 -rotate-[28deg] rounded-[50%] border border-violet-300/70" />
      <span className="size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.75)]" />
    </span>
  );
}
