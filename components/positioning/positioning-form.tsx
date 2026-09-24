"use client";

/**
 * PositioningForm — handles both create and edit modes.
 *
 * This is a client component so it can manage local form state.
 * Mutations go through Server Actions (lib/positioning/actions.ts) — no direct
 * DB access from this component.
 *
 * Props:
 *   productId     — resolved server-side, passed down as a prop
 *   positioning   — if provided, pre-populates the form for editing
 *   onSuccess     — called with the saved PositioningRow after a successful mutation
 *   onCancel      — called when the user dismisses the form
 */

import { useState, useTransition, useRef, useEffect } from "react";
import { createPositioningAction, updatePositioningAction } from "@/lib/positioning/actions";
import { getAiAvailabilityAction, generatePositioningDraftAction } from "@/lib/ai/actions";
import type { PositioningRow } from "@/lib/positioning/types";
import { cn } from "@/lib/utils";
import { useProductContext } from "@/lib/product-context";

// ---------------------------------------------------------------------------
// Field helpers (same pattern as icp-form.tsx)
// ---------------------------------------------------------------------------

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </label>
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={cn(
        "w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

/**
 * Inline tag input — Enter or comma adds a new tag.
 */
function TagInput({
  id,
  values,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-[38px] flex-wrap gap-1.5 rounded-sm border border-border bg-surface px-2 py-1.5",
        "focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50",
      )}
      onClick={() => inputRef.current?.focus()}
      role="group"
      aria-label={placeholder}
    >
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-sm bg-foreground/8 px-2 py-0.5 text-xs text-foreground"
        >
          {v}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(values.filter((_, j) => j !== i));
              }}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${v}`}
            >
              x
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="min-w-32 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  positioning_statement: string;
  target_customer: string;
  customer_problem: string;
  unique_value: string;
  alternatives: string[];
  proof_points: string[];
  notes: string;
}

function emptyState(): FormState {
  return {
    positioning_statement: "",
    target_customer: "",
    customer_problem: "",
    unique_value: "",
    alternatives: [],
    proof_points: [],
    notes: "",
  };
}

function fromRow(row: PositioningRow): FormState {
  return {
    positioning_statement: row.positioning_statement ?? "",
    target_customer: row.target_customer ?? "",
    customer_problem: row.customer_problem ?? "",
    unique_value: row.unique_value ?? "",
    alternatives: row.alternatives ?? [],
    proof_points: row.proof_points ?? [],
    notes: row.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// PositioningForm
// ---------------------------------------------------------------------------

export function PositioningForm({
  productId,
  positioning,
  onSuccess,
  onCancel,
}: {
  productId: string;
  positioning?: PositioningRow;
  onSuccess: (saved: PositioningRow) => void;
  onCancel: () => void;
}) {
  const isEdit = positioning !== undefined;
  const [form, setForm] = useState<FormState>(
    isEdit ? fromRow(positioning) : emptyState(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    getAiAvailabilityAction().then((res) => setIsAiEnabled(res.isAiEnabled));
  }, []);

  async function handleAiDraft() {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setIsAiLoading(true);
    setError(null);
    const result = await generatePositioningDraftAction(productId, prompt);
    setIsAiLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    const draft = result.data;
    setForm((prev) => ({
      ...prev,
      positioning_statement: draft.positioning_statement || "",
      target_customer: draft.target_customer || "",
      customer_problem: draft.customer_problem || "",
      unique_value: draft.unique_value || "",
      alternatives: draft.alternatives || [],
      proof_points: draft.proof_points || [],
    }));
    setAiPrompt("");
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = {
        positioning_statement: form.positioning_statement || undefined,
        target_customer: form.target_customer || undefined,
        customer_problem: form.customer_problem || undefined,
        unique_value: form.unique_value || undefined,
        alternatives: form.alternatives.length > 0 ? form.alternatives : undefined,
        proof_points: form.proof_points.length > 0 ? form.proof_points : undefined,
        notes: form.notes || undefined,
      };

      let result;
      if (isEdit) {
        result = await updatePositioningAction(productId, positioning.id, payload);
      } else {
        result = await createPositioningAction(productId, {
          productId,
          ...payload,
        });
      }

      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onSuccess(result.data);
    });
  }

  const { workspaceSlug } = useProductContext();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!positioning && (
        <div className="rounded-md border border-accent bg-accent/5 p-4 space-y-3">
          <label className="block text-sm font-medium text-foreground">
            ✨ Draft with AI
          </label>
          
          {isAiEnabled ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. A privacy-focused alternative to Google Analytics..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAiDraft();
                  }
                }}
                className="flex-1 rounded-sm border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                disabled={isAiLoading}
              />
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="rounded-sm bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                {isAiLoading ? "Generating..." : "Generate Draft"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">AI isn&apos;t configured yet.</p>
              <a
                href={`/settings?w=${workspaceSlug}`}
                className="text-accent hover:underline font-medium"
              >
                [Configure AI]
              </a>
            </div>
          )}
        </div>
      )}

      {/* Positioning Statement */}
      <div className="space-y-2">
        <Label htmlFor="pos-statement">Positioning Statement</Label>
        <Textarea
          id="pos-statement"
          value={form.positioning_statement}
          onChange={(v) => set("positioning_statement", v)}
          placeholder='For [target customer] who [need], [product] is [category] that [benefit]. Unlike [alternatives], [product] [key differentiator].'
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Customer & Problem */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pos-target-customer">Target Customer</Label>
          <Textarea
            id="pos-target-customer"
            value={form.target_customer}
            onChange={(v) => set("target_customer", v)}
            placeholder="Describe the intended customer in your own words"
            rows={3}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos-customer-problem">Customer Problem</Label>
          <Textarea
            id="pos-customer-problem"
            value={form.customer_problem}
            onChange={(v) => set("customer_problem", v)}
            placeholder="What core problem does this product solve?"
            rows={3}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Differentiation */}
      <div className="space-y-2">
        <Label htmlFor="pos-unique-value">Unique Value</Label>
        <Textarea
          id="pos-unique-value"
          value={form.unique_value}
          onChange={(v) => set("unique_value", v)}
          placeholder="What differentiated value does this product deliver that alternatives do not?"
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Proof Points */}
      <div className="space-y-2">
        <Label htmlFor="pos-proof-points">Proof Points</Label>
        <TagInput
          id="pos-proof-points"
          values={form.proof_points}
          onChange={(v) => set("proof_points", v)}
          placeholder="Add a proof point and press Enter (e.g. 10 customers in 30 days)"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add. Each point max 500 characters.
        </p>
      </div>

      {/* Alternatives */}
      <div className="space-y-2">
        <Label htmlFor="pos-alternatives">Alternatives / Competitors</Label>
        <TagInput
          id="pos-alternatives"
          values={form.alternatives}
          onChange={(v) => set("alternatives", v)}
          placeholder="Add an alternative and press Enter (e.g. Notion, Spreadsheets)"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add. Each alternative max 500 characters.
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="pos-notes">Notes</Label>
        <Textarea
          id="pos-notes"
          value={form.notes}
          onChange={(v) => set("notes", v)}
          placeholder="Internal notes, open questions, or work in progress"
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="border border-border bg-surface/40 px-4 py-3 text-sm text-foreground"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-sm border border-border bg-foreground px-4 py-2 text-sm font-medium text-background",
            "hover:bg-foreground/90 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
          )}
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Define Positioning"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className={cn(
            "rounded-sm border border-border px-4 py-2 text-sm font-medium text-muted-foreground",
            "hover:border-foreground/20 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
          )}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}