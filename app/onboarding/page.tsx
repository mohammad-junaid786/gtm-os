import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding | GTM OS",
};

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <OnboardingForm />
    </div>
  );
}
