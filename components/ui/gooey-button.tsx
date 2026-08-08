"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GooeySvgFilter() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute size-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 1" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="5" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="-5 11" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

export type GooeyButtonVariant =
  | "purple"
  | "emerald"
  | "amber"
  | "dark"
  | "indigo";

export type GooeyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GooeyButtonVariant;
  children: ReactNode;
  icon?: ReactNode;
};

const VARIANT_STYLES: Record<GooeyButtonVariant, { bg: string; text: string; blob: string }> = {
  purple: {
    bg: "bg-[#6e5ae6] border-[#5b3df5]",
    text: "text-white font-bold",
    blob: "bg-[#8b7bff]",
  },
  indigo: {
    bg: "bg-indigo-600 border-indigo-500",
    text: "text-white font-bold",
    blob: "bg-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-600 border-emerald-500",
    text: "text-white font-bold",
    blob: "bg-emerald-400",
  },
  amber: {
    bg: "bg-amber-500 border-amber-400",
    text: "text-slate-950 font-bold",
    blob: "bg-amber-300",
  },
  dark: {
    bg: "bg-slate-900 border-slate-700 dark:bg-slate-950 dark:border-slate-800",
    text: "text-white font-bold",
    blob: "bg-purple-600",
  },
};

export const GooeyButton = forwardRef<HTMLButtonElement, GooeyButtonProps>(
  (
    {
      variant = "purple",
      className,
      children,
      icon,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const style = VARIANT_STYLES[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-xs transition-all duration-300 ease-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md hover:shadow-lg",
          style.bg,
          style.text,
          className,
        )}
        {...props}
      >
        {/* Liquid Gooey Morphing Background Blobs */}
        <span
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-90 transition-opacity group-hover:opacity-100"
          style={{ filter: "url(#goo)" }}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute -left-4 -top-4 size-10 rounded-full transition-all duration-500 ease-out group-hover:scale-[3.5] group-hover:translate-x-12 group-hover:translate-y-6",
              style.blob,
            )}
          />
          <span
            className={cn(
              "absolute -right-4 -bottom-4 size-10 rounded-full transition-all duration-500 ease-out group-hover:scale-[3.5] group-hover:-translate-x-12 group-hover:-translate-y-6",
              style.blob,
            )}
          />
        </span>

        {/* Foreground Content */}
        <span className="relative z-10 flex flex-row items-center justify-center gap-2 whitespace-nowrap font-bold">
          {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
          <span className="truncate">{children}</span>
        </span>
      </button>
    );
  },
);

GooeyButton.displayName = "GooeyButton";
