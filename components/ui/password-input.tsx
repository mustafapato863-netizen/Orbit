"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Password input with an accessible visibility toggle. Keeping this in one
 * place ensures authentication and administration forms behave consistently.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(function PasswordInput({ className, ...props }, ref) {
  const [isVisible, setIsVisible] = React.useState(false);
  const label = isVisible ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={isVisible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
        aria-label={label}
        aria-pressed={isVisible}
        title={label}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" />
        ) : (
          <Eye aria-hidden="true" />
        )}
      </Button>
    </div>
  );
});

