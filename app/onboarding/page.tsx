import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <OnboardingForm mode={mode} workspaceId={workspaceId} />
    </div>
  );
}
