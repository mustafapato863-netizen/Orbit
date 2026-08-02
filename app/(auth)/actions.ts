"use server";

import { redirect } from "next/navigation";

import {
  changePasswordSchema,
  signInSchema,
  type ActionResult,
} from "@/lib/auth/auth.schemas";
import {
  authenticateUser,
  changeUserPassword,
  SignInError,
  signOutSession,
} from "@/lib/auth/authentication.service";
import { requireSession } from "@/lib/auth/authorization";
import {
  clearSessionCookie,
  getCurrentSession,
  setSessionCookie,
} from "@/lib/auth/session";

function validationFailure(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
): ActionResult {
  return {
    success: false,
    message: "Review the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const result = await authenticateUser(
      parsed.data.email,
      parsed.data.password,
    );
    await setSessionCookie(result.token, result.expiresAt);

    redirect(
      result.mustChangePassword
        ? "/change-password"
        : (parsed.data.nextPath ?? "/"),
    );
  } catch (error) {
    if (error instanceof SignInError) {
      return {
        success: false,
        message:
          error.code === "TOO_MANY_ATTEMPTS"
            ? "Too many unsuccessful attempts. Try again in 15 minutes."
            : "The email address or password is incorrect.",
      };
    }

    throw error;
  }
}

export async function signOutAction() {
  const context = await getCurrentSession();

  if (context) {
    await signOutSession(context);
  }

  await clearSessionCookie();
  redirect("/sign-in");
}

export async function changePasswordAction(
  input: unknown,
  redirectTo: "workspace" | "profile" = "workspace",
): Promise<ActionResult> {
  const context = await requireSession({ allowPasswordChange: true });
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  if (!(await changeUserPassword(context, parsed.data))) {
    return {
      success: false,
      message: "Your current password is incorrect.",
      fieldErrors: { currentPassword: ["Enter your current password."] },
    };
  }

  redirect(redirectTo === "profile" ? "/profile" : "/");
}
