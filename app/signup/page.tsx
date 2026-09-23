import { SignupForm } from "@/components/auth/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";
import { redirect, RedirectType } from "next/navigation";

export const metadata = {
  title: "Sign Up | GTM OS",
};

export default async function SignupPage() {
  const userId = await getCurrentUserId();
  if (userId) {
    const redirectUrl = await resolveUserDefaultRoute(userId);
    redirect(redirectUrl, RedirectType.replace);
  }

  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
