import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        gooey:
          "group relative overflow-hidden bg-[#6e5ae6] text-white border border-[#5b3df5] font-bold shadow-md hover:shadow-lg active:scale-95",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Component = asChild ? Slot : "button";

  if (variant === "gooey" && !asChild) {
    return (
      <button
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        <span
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-90 transition-opacity group-hover:opacity-100"
          style={{ filter: "url(#goo)" }}
          aria-hidden="true"
        >
          <span className="absolute -left-4 -top-4 size-10 rounded-full bg-[#8b7bff] transition-all duration-500 ease-out group-hover:scale-[3.5] group-hover:translate-x-12 group-hover:translate-y-6" />
          <span className="absolute -right-4 -bottom-4 size-10 rounded-full bg-[#8b7bff] transition-all duration-500 ease-out group-hover:scale-[3.5] group-hover:-translate-x-12 group-hover:-translate-y-6" />
        </span>
        <span className="relative z-10 inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap font-bold">
          {children}
        </span>
      </button>
    );
  }

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Component>
  );
}

export { Button, buttonVariants };
