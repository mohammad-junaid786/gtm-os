"use client";

import { useState } from "react";
import { submitOnboardingAction } from "@/lib/actions/onboarding-actions";
import { createDemoAction } from "@/lib/actions/demo-actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  const title = isCreateProduct ? "Create a Product" : mode === "create-workspace" ? "Create a Workspace" : "Welcome to GTM OS Workspace";
  const subtitle = isCreateProduct ? "Add a new product to your workspace." : mode === "create-workspace" ? "Set up a new workspace and your first product." : "Let's set up your first workspace and product to get started.";
  const showDemo = mode === "onboarding";

  return (
    <div className="w-full text-center">
      <div className="space-y-2 mb-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4 text-left">
        {!isCreateProduct && (
          <div className="space-y-2 flex flex-col">
            <label htmlFor="workspaceName" className="text-sm font-semibold text-foreground">Workspace Name</label>
            <input 
              id="workspaceName" 
              name="workspaceName" 
              placeholder="e.g. Acme Corp" 
              required 
              className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
            />
          </div>
        )}
        <div className="space-y-2 flex flex-col">
          <label htmlFor="productName" className="text-sm font-semibold text-foreground">Product Name</label>
          <input 
            id="productName" 
            name="productName" 
            placeholder="e.g. Acme SaaS" 
            required 
            className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>

        <Button type="submit" size="lg" className="w-full mt-2 bg-[#0055FF] hover:bg-[#0055FF]/90 text-white font-medium" disabled={loading || demoLoading}>
          {loading ? "Creating..." : isCreateProduct ? "Create Product" : "Complete Setup"}
        </Button>
      </form>

      {showDemo && (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDemo}
            disabled={loading || demoLoading}
            className="w-full text-foreground hover:bg-muted"
          >
            {demoLoading ? "Preparing Demo..." : "Try Demo Mode"}
          </Button>
        </>
      )}
    </div>
  );
}
