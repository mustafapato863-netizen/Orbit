"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { changePasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/auth/auth.schemas";

export function ChangePasswordForm({
  redirectTo = "workspace",
}: {
  redirectTo?: "workspace" | "profile";
} = {}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePasswordAction(values, redirectTo);

      if (!result.success) {
        setError("root", {
          message: result.message ?? "The password could not be changed.",
        });
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          const message = messages?.[0];
          if (
            message &&
            (field === "currentPassword" ||
              field === "newPassword" ||
              field === "confirmPassword")
          ) {
            setError(field, { message });
          }
        }
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.root?.message ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      ) : null}
      {[
        {
          name: "currentPassword" as const,
          label: "Current password",
          autoComplete: "current-password",
        },
        {
          name: "newPassword" as const,
          label: "New password",
          autoComplete: "new-password",
        },
        {
          name: "confirmPassword" as const,
          label: "Confirm new password",
          autoComplete: "new-password",
        },
      ].map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <PasswordInput
            id={field.name}
            type="password"
            autoComplete={field.autoComplete}
            aria-invalid={Boolean(errors[field.name])}
            {...register(field.name)}
          />
          {errors[field.name]?.message ? (
            <p className="text-xs text-destructive">
              {errors[field.name]?.message}
            </p>
          ) : null}
        </div>
      ))}
      <p className="text-xs leading-5 text-muted-foreground">
        Use 12 or more characters with uppercase, lowercase, a number, and a
        symbol. Other active sessions will be signed out.
      </p>
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <KeyRound aria-hidden="true" />
        )}
        {isPending ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
