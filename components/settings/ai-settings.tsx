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
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-foreground tracking-tight">AI Configuration</h2>
      <div className="rounded-md border border-border bg-background p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          The AI provider is configured for this GTM OS installation, not stored separately for this workspace. AI credentials are managed server-side and are never exposed to the browser.
        </p>

        {status.isConfigured ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium text-foreground">Configured</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Provider</p>
                <p className="text-sm text-foreground">{status.provider}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Model</p>
                <p className="text-sm text-foreground font-mono">{status.model}</p>
              </div>
              {status.baseUrl && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Base URL</p>
                  <p className="text-sm text-foreground font-mono truncate">{status.baseUrl}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isPending}
                className={cn(
                  "rounded-sm border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground",
                  "hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50",
                  "focus:outline-none focus:ring-1 focus:ring-ring"
                )}
              >
                {isPending ? "Testing..." : "Test Connection"}
              </button>
            </div>

            {testResult && (
              <p
                className={cn(
                  "text-sm p-3 rounded-sm border",
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
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-muted-foreground/50"></span>
              <span className="text-sm font-medium text-foreground">Not configured</span>
            </div>
            
            <p className="text-sm text-foreground">
              AI is optional in GTM OS. To enable AI drafting features, configure the provider through your environment variables.
            </p>

            <div className="space-y-3 mt-4">
              <div className="rounded-sm bg-accent/5 border border-accent/20 p-4">
                <p className="text-sm font-medium mb-2">OpenAI-compatible</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
AI_PROVIDER=openai-compatible
AI_MODEL=gpt-4o
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com
                </pre>
              </div>
              <div className="rounded-sm bg-accent/5 border border-accent/20 p-4">
                <p className="text-sm font-medium mb-2">Ollama</p>
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
    </section>
  );
}
