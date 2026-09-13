import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";
import { redirect } from "next/navigation";
export const metadata: Metadata = { title: "GTM OS" };

export default async function RootPage() {
  const userId = await getCurrentUserId();
  if (userId) {
    const redirectUrl = await resolveUserDefaultRoute(userId);
    redirect(redirectUrl);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4">Welcome to GTM OS</h1>
        <p className="text-muted-foreground text-center mb-8">
          Your Go-To-Market Operating System for strategy, execution, and analytics.
        </p>

        <Link
          href="/login"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
