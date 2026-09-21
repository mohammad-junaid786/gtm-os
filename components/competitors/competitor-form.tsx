"use client";

import { useState, useRef } from "react";
import type { CompetitorRow, CreateCompetitorInput, UpdateCompetitorInput } from "@/lib/competitors/types";
import { createCompetitorAction, updateCompetitorAction } from "@/lib/competitors/actions";
import { cn } from "@/lib/utils";

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
// Form Component
// ---------------------------------------------------------------------------

export function CompetitorForm({
  productId,
  competitor,
  onSave,
  onCancel,
}: {
  productId: string;
  competitor: CompetitorRow | null;
  onSave: (c: CompetitorRow) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(competitor?.name ?? "");
  const [website, setWebsite] = useState(competitor?.website ?? "");
  const [category, setCategory] = useState(competitor?.category ?? "");
  const [description, setDescription] = useState(competitor?.description ?? "");
  const [pricingNotes, setPricingNotes] = useState(competitor?.pricing_notes ?? "");
  const [strengths, setStrengths] = useState<string[]>(competitor?.strengths ?? []);
  const [weaknesses, setWeaknesses] = useState<string[]>(competitor?.weaknesses ?? []);
  const [differentiators, setDifferentiators] = useState<string[]>(competitor?.differentiators ?? []);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Competitor name is required.");
      return;
    }
    
    setErrorMsg(null);
    setIsSubmitting(true);

    const payload = {
      name,
      website: website || undefined,
      category: category || undefined,
      description: description || undefined,
      pricing_notes: pricingNotes || undefined,
      strengths: strengths.length > 0 ? strengths : undefined,
      weaknesses: weaknesses.length > 0 ? weaknesses : undefined,
      differentiators: differentiators.length > 0 ? differentiators : undefined,
    };

    let result;
    if (competitor) {
      result = await updateCompetitorAction(productId, competitor.id, payload as UpdateCompetitorInput);
    } else {
      result = await createCompetitorAction({ ...payload, productId } as CreateCompetitorInput);
    }

    if (result.ok) {
      onSave(result.data);
    } else {
      setErrorMsg(result.error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card text-card-foreground rounded-xl border shadow-lg flex flex-col max-h-full">
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">
            {competitor ? "Edit Competitor" : "Add Competitor"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track key details about this competitor.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-6 overflow-y-auto space-y-6">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="comp-name" className="text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="comp-name"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="comp-website" className="text-sm font-medium">
                  Website
                </label>
                <input
                  id="comp-website"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="comp-category" className="text-sm font-medium">
                Category
              </label>
              <input
                id="comp-category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Direct Competitor, Status Quo, Substitute"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="comp-overview" className="text-sm font-medium">
                Overview
              </label>
              <textarea
                id="comp-overview"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the competitor..."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="comp-strengths" className="text-sm font-medium text-green-600 dark:text-green-500">
                  Strengths
                </label>
                <TagInput
                  id="comp-strengths"
                  values={strengths}
                  onChange={setStrengths}
                  placeholder="Add a strength..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Press Enter to add.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="comp-weaknesses" className="text-sm font-medium text-red-600 dark:text-red-500">
                  Weaknesses
                </label>
                <TagInput
                  id="comp-weaknesses"
                  values={weaknesses}
                  onChange={setWeaknesses}
                  placeholder="Add a weakness..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Press Enter to add.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="comp-differentiators" className="text-sm font-medium text-blue-600 dark:text-blue-500">
                How We Win (Differentiators)
              </label>
              <TagInput
                id="comp-differentiators"
                values={differentiators}
                onChange={setDifferentiators}
                placeholder="Add a differentiator..."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="comp-pricing" className="text-sm font-medium">
                Pricing & Business Model
              </label>
              <textarea
                id="comp-pricing"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder="Notes on how they price..."
                disabled={isSubmitting}
              />
            </div>

          </div>

          <div className="p-6 border-t flex-shrink-0 flex justify-end gap-3 bg-muted/20">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
