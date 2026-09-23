"use client";

/**
 * ICP form component — handles both create and edit modes.
 *
 * This is a client component so it can manage local form state.
 * Mutations go through Server Actions (lib/icp/actions.ts) — no direct
 * DB access from this component.
 *
 * Props:
 *   productId   — resolved server-side, passed down as a prop
 *   icp         — if provided, pre-populates the form for editing
 *   onSuccess   — called with the saved IcpRow after a successful mutation
 *   onCancel    — called when the user dismisses the form
 */

import { useState, useTransition, useRef, useEffect } from "react";
import { createIcpAction, updateIcpAction } from "@/lib/icp/actions";
import { getAiAvailabilityAction, generateIcpDraftAction } from "@/lib/ai/actions";
import { BUSINESS_MODELS } from "@/lib/icp/types";
import type { IcpRow, BusinessModel } from "@/lib/icp/types";
import { cn } from "@/lib/utils";
import { useProductContext } from "@/lib/product-context";

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength = 255,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
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
 * Inline tag input — comma-separated values stored as string[].
 * Each press of Enter or comma adds a new tag.
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
              ×
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
  name: string;
  description: string;
  industry: string;
  company_size: string;
  geography: string;
  business_model: BusinessModel | "";
  pain_points: string[];
  goals: string[];
  buying_signals: string[];
  disqualifiers: string[];
  notes: string;
}

function fromIcp(icp: IcpRow | undefined): FormState {
  return {
    name: icp?.name ?? "",
    description: icp?.description ?? "",
    industry: icp?.industry ?? "",
    company_size: icp?.company_size ?? "",
    geography: icp?.geography ?? "",
    business_model: icp?.business_model ?? "",
    pain_points: icp?.pain_points ?? [],
    goals: icp?.goals ?? [],
    buying_signals: icp?.buying_signals ?? [],
    disqualifiers: icp?.disqualifiers ?? [],
    notes: icp?.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// IcpForm
// ---------------------------------------------------------------------------

export function IcpForm({
  productId,
  icp,
  onSuccess,
  onCancel,
}: {
  productId: string;
  icp?: IcpRow;
  onSuccess: (saved: IcpRow) => void;
  onCancel: () => void;
}) {
  const isEdit = icp !== undefined;
  const [form, setForm] = useState<FormState>(() => fromIcp(icp));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setErrorMsg(null);
    const result = await generateIcpDraftAction(productId, prompt);
    setIsAiLoading(false);
    if (!result.ok) {
      setErrorMsg(result.error.message);
      return;
    }
    const draft = result.data;
    setForm((prev) => ({
      ...prev,
      name: draft.name,
      description: draft.description || "",
      industry: draft.industry || "",
      company_size: draft.company_size || "",
      geography: draft.geography || "",
      business_model: draft.business_model || "",
      pain_points: draft.pain_points || [],
      goals: draft.goals || [],
      buying_signals: draft.buying_signals || [],
      disqualifiers: draft.disqualifiers || [],
    }));
    setAiPrompt("");
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const bm = form.business_model || undefined;
    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateIcpAction(productId, icp.id, {
          name: form.name,
          description: form.description || undefined,
          industry: form.industry || undefined,
          company_size: form.company_size || undefined,
          geography: form.geography || undefined,
          business_model: (bm as BusinessModel) ?? null,
          pain_points: form.pain_points.length > 0 ? form.pain_points : undefined,
          goals: form.goals.length > 0 ? form.goals : undefined,
          buying_signals: form.buying_signals.length > 0 ? form.buying_signals : undefined,
          disqualifiers: form.disqualifiers.length > 0 ? form.disqualifiers : undefined,
          notes: form.notes || undefined,
        });
      } else {
        result = await createIcpAction({
          productId,
          name: form.name,
          description: form.description || undefined,
          industry: form.industry || undefined,
          company_size: form.company_size || undefined,
          geography: form.geography || undefined,
          business_model: bm as BusinessModel | undefined,
          pain_points: form.pain_points.length > 0 ? form.pain_points : undefined,
          goals: form.goals.length > 0 ? form.goals : undefined,
          buying_signals: form.buying_signals.length > 0 ? form.buying_signals : undefined,
          disqualifiers: form.disqualifiers.length > 0 ? form.disqualifiers : undefined,
          notes: form.notes || undefined,
        });
      }

      if (!result.ok) {
        setErrorMsg(result.error.message);
        return;
      }
      onSuccess(result.data);
    });
  }

  const { workspaceSlug } = useProductContext();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <p role="alert" className="rounded-sm border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {errorMsg}
        </p>
      )}

      {!isEdit && (
        <div className="rounded-md border border-accent bg-accent/5 p-4 space-y-3">
          <label className="block text-sm font-medium text-foreground">
            ✨ Draft with AI
          </label>
          
          {isAiEnabled ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. Mid-market healthcare providers looking to reduce compliance overhead..."
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
              <p className="text-muted-foreground">AI isn't configured yet.</p>
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

      {/* ── Identity ──────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Identity</legend>
        <div className="space-y-1.5">
          <Label htmlFor="icp-name">Name *</Label>
          <TextInput
            id="icp-name"
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="e.g. Growth-stage B2B SaaS"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="icp-description">Description</Label>
          <Textarea
            id="icp-description"
            value={form.description}
            onChange={(v) => set("description", v)}
            placeholder="Briefly describe this ideal customer profile…"
            disabled={isPending}
          />
        </div>
      </fieldset>

      {/* ── Firmographics ─────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Firmographics</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="icp-industry">Industry</Label>
            <TextInput
              id="icp-industry"
              value={form.industry}
              onChange={(v) => set("industry", v)}
              placeholder="e.g. SaaS, Financial Services"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icp-size">Company size</Label>
            <TextInput
              id="icp-size"
              value={form.company_size}
              onChange={(v) => set("company_size", v)}
              placeholder="e.g. 11–200 employees"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icp-geo">Geography</Label>
            <TextInput
              id="icp-geo"
              value={form.geography}
              onChange={(v) => set("geography", v)}
              placeholder="e.g. North America, EMEA"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="icp-bm">Business model</Label>
            <select
              id="icp-bm"
              value={form.business_model}
              onChange={(e) => set("business_model", e.target.value as BusinessModel | "")}
              disabled={isPending}
              className={cn(
                "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
                "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
              )}
            >
              <option value="">— Any —</option>
              {BUSINESS_MODELS.map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Needs & signals ───────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Needs &amp; Signals</legend>
        <p className="text-xs text-muted-foreground">Press Enter or comma to add each item.</p>
        <div className="space-y-1.5">
          <Label htmlFor="icp-pain">Pain points</Label>
          <TagInput
            id="icp-pain"
            values={form.pain_points}
            onChange={(v) => set("pain_points", v)}
            placeholder="Add a pain point…"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="icp-goals">Goals / outcomes</Label>
          <TagInput
            id="icp-goals"
            values={form.goals}
            onChange={(v) => set("goals", v)}
            placeholder="Add a goal…"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="icp-signals">Buying signals</Label>
          <TagInput
            id="icp-signals"
            values={form.buying_signals}
            onChange={(v) => set("buying_signals", v)}
            placeholder="Add a buying signal…"
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="icp-disq">Disqualifiers</Label>
          <TagInput
            id="icp-disq"
            values={form.disqualifiers}
            onChange={(v) => set("disqualifiers", v)}
            placeholder="Add a disqualifier…"
            disabled={isPending}
          />
        </div>
      </fieldset>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Notes</legend>
        <Textarea
          id="icp-notes"
          value={form.notes}
          onChange={(v) => set("notes", v)}
          placeholder="Any additional context or research notes…"
          rows={4}
          disabled={isPending}
        />
      </fieldset>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending || form.name.trim() === ""}
          className={cn(
            "rounded-sm border border-border bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground",
            "hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40",
            "focus:outline-none focus:ring-1 focus:ring-ring",
          )}
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create ICP"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm text-muted-foreground hover:text-foreground focus:outline-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
