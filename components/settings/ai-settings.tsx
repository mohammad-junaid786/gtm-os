"use client";

import { useState, useTransition } from "react";
import { testAiConnectionAction } from "@/lib/ai/actions";
import { cn } from "@/lib/utils";

export function AiSettings({
  status,
}: {
  status: {
    isConfigured: boolean;
    provider: "openai-compatible" | "ollama" | null;
    model: string | null;
    baseUrl: string | null;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleTestConnection() {
    setTestResult(null);
    startTransition(async () => {
      const result = await testAiConnectionAction();
      setTestResult(result);
    });
  }

  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-12">
      <div className="md:w-1/3 shrink-0">
        <h2 className="text-base font-semibold text-foreground tracking-tight">AI Provider</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration for the global AI drafting features.
        </p>
      </div>
      <div className="flex-1 rounded-xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            The AI provider is configured for this GTM OS installation, not stored separately for this workspace. AI credentials are managed server-side and are never exposed to the browser.
          </p>

          {status.isConfigured ? (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-foreground">Configured</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Provider</p>
                  <p className="text-sm text-foreground">{status.provider}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Model</p>
                  <p className="text-sm text-foreground font-mono bg-surface-subtle inline-block px-2 py-0.5 rounded-md border border-border mt-1">{status.model}</p>
                </div>
                {status.baseUrl && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Base URL</p>
                    <p className="text-sm text-foreground font-mono truncate bg-surface-subtle inline-block px-2 py-0.5 rounded-md border border-border mt-1">{status.baseUrl}</p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center justify-center rounded-sm border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                >
                  {isPending ? "Testing..." : "Test Connection"}
                </button>
              </div>

              {testResult && (
                <p
                  className={cn(
                    "text-sm p-3 rounded-md border",
                    testResult.ok
                      ? "bg-green-50 text-green-900 border-green-200"
                      : "bg-red-50 text-red-900 border-red-200"
                  )}
                >
                  {testResult.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                <span className="text-sm font-medium text-foreground">Not configured</span>
              </div>

              <p className="text-sm text-foreground">
                AI is optional in GTM OS. To enable AI drafting features, configure the provider through your environment variables.
              </p>

              <div className="space-y-4 mt-6">
                <div className="rounded-md bg-surface-subtle border border-border-subtle p-4">
                  <p className="text-sm font-semibold mb-2">OpenAI-compatible</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
AI_PROVIDER=openai-compatible
AI_MODEL=gpt-4o
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com
                  </pre>
                </div>
                <div className="rounded-md bg-surface-subtle border border-border-subtle p-4">
                  <p className="text-sm font-semibold mb-2">Ollama</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
AI_PROVIDER=ollama
AI_MODEL=llama3.1
AI_BASE_URL=http://localhost:11434
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
