import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "GTM OS" };

export default async function RootPage() {
  async function handleGetStarted() {
    "use server";
    const userId = await getCurrentUserId();
    if (!userId) {
      redirect("/login");
    }
    const redirectUrl = await resolveUserDefaultRoute(userId);
    redirect(redirectUrl);
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Welcome to GTM OS
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your Go-To-Market Operating System for strategy, execution, and analytics.
          </p>
        </div>

        <form action={handleGetStarted} className="w-full">
          <Button type="submit" size="lg" className="w-full bg-[#0055FF] hover:bg-[#0055FF]/90 text-white font-medium">
            Get Started
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
