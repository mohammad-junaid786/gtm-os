"use client";

import { useState } from "react";
import { submitOnboardingAction } from "@/lib/actions/onboarding-actions";
import { createDemoAction } from "@/lib/actions/demo-actions";
import { useRouter } from "next/navigation";

export function OnboardingForm({
  mode = "onboarding",
  workspaceId,
}: {
  mode?: "onboarding" | "create-workspace" | "create-product";
  workspaceId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (workspaceId) formData.append("workspaceId", workspaceId);
    if (mode) formData.append("mode", mode);
    
    try {
      const result = await submitOnboardingAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // Catch redirect
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    setError(null);
    try {
      const result = await createDemoAction();
      if (!result.ok) {
        setError(result.error);
      } else {
        router.push(result.redirectUrl);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setDemoLoading(false);
    }
  }

  const isCreateProduct = mode === "create-product";
  const title = isCreateProduct ? "Create a Product" : mode === "create-workspace" ? "Create a Workspace" : "Welcome to GTM OS";
  const subtitle = isCreateProduct ? "Add a new product to your workspace." : mode === "create-workspace" ? "Set up a new workspace and your first product." : "Let's set up your first workspace and product to get started.";
  const showDemo = mode === "onboarding";

  return (
    <div className="w-full max-w-md p-8 bg-card text-card-foreground rounded-lg border shadow-sm">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{subtitle}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {!isCreateProduct && (
          <div className="space-y-2 flex flex-col">
            <label htmlFor="workspaceName" className="text-sm font-medium">Workspace Name</label>
            <input id="workspaceName" name="workspaceName" placeholder="e.g. Acme Corp" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>
        )}
        <div className="space-y-2 flex flex-col">
          <label htmlFor="productName" className="text-sm font-medium">Product Name</label>
          <input id="productName" name="productName" placeholder="e.g. Acme SaaS" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
        </div>

        <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4" disabled={loading || demoLoading}>
          {loading ? "Creating..." : isCreateProduct ? "Create Product" : "Complete Setup"}
        </button>
      </form>

      {showDemo && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={loading || demoLoading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
          >
            {demoLoading ? "Preparing Demo..." : "Try Demo Mode"}
          </button>
        </>
      )}
    </div>
  );
}
