import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();

  if (session) {
    redirect(session.user.mustChangePassword ? "/change-password" : "/");
  }

  const { next } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with your Orbit account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm nextPath={nextPath} />
      </CardContent>
    </Card>
  );
}
