import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata = {
  title: "Onboarding | GTM OS",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; workspaceId?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  const resolved = await searchParams;
  const mode = resolved.mode === "create-product"
    ? "create-product"
    : resolved.mode === "create-workspace"
    ? "create-workspace"
    : "onboarding";
  const workspaceId = resolved.workspaceId;

  return (
    <AuthLayout>
      <OnboardingForm mode={mode} workspaceId={workspaceId} />
    </AuthLayout>
  );
}
