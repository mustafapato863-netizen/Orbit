"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LogIn } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { signInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInSchema,
  type SignInInput,
} from "@/lib/auth/auth.schemas";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", nextPath },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signInAction(values);

      if (!result.success) {
        setError("root", {
          message: result.message ?? "Sign-in was unsuccessful.",
        });

        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          const message = messages?.[0];
          if (message && (field === "email" || field === "password")) {
            setError(field, { message });
          }
        }
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {errors.root?.message ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email?.message ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password?.message ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
