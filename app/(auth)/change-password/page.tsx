import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {session.user.mustChangePassword
            ? "Secure your account"
            : "Change your password"}
        </CardTitle>
        <CardDescription>
          {session.user.mustChangePassword
            ? "A new password is required before you can enter the workspace."
            : "Update your password and revoke your other active sessions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
