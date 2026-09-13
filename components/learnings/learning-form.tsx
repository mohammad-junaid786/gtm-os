"use client";

import { useState, useTransition } from "react";
import { createLearningAction, updateLearningAction } from "@/lib/learnings/actions";
import { SOURCE_TYPES, CONFIDENCE_LEVELS, IMPACT_LEVELS } from "@/lib/learnings/types";
import type { LearningRow, SourceType, ConfidenceLevel, ImpactLevel } from "@/lib/learnings/types";
import { cn } from "@/lib/utils";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 4,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 resize-y",
      )}
    />
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
  allowEmpty,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    >
      {allowEmpty && <option value="">-- None --</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TagInput({
  id,
  tags,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div
      className={cn(
        "flex min-h-[38px] w-full flex-wrap gap-1.5 rounded-sm border border-border bg-surface px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50"
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-muted/20 px-2 py-0.5 text-xs text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            disabled={disabled}
            className="text-muted hover:text-foreground focus:outline-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={disabled}
        className="flex-1 bg-transparent px-1 text-sm text-foreground focus:outline-none placeholder:text-muted min-w-[120px]"
      />
    </div>
  );
}

export function LearningForm({
  productId,
  learning,
  onSuccess,
  onCancel,
}: {
  productId: string;
  learning?: LearningRow;
  onSuccess: (learning: LearningRow) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState(learning?.title ?? "");
  const [insight, setInsight] = useState(learning?.insight ?? "");
  const [sourceType, setSourceType] = useState<string>(learning?.source_type ?? "");
  const [sourceId, setSourceId] = useState(learning?.source_id ?? "");
  const [confidenceLevel, setConfidenceLevel] = useState<string>(learning?.confidence_level ?? "");
  const [impactLevel, setImpactLevel] = useState<string>(learning?.impact_level ?? "");
  const [actionItems, setActionItems] = useState<string[]>(learning?.action_items ?? []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg("Title is required.");
      return;
    }

    const trimmedInsight = insight.trim();
    if (!trimmedInsight) {
      setErrorMsg("Insight is required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: trimmedTitle,
        insight: trimmedInsight,
        source_type: sourceType ? (sourceType as SourceType) : undefined,
        source_id: sourceId.trim() || undefined,
        confidence_level: confidenceLevel ? (confidenceLevel as ConfidenceLevel) : undefined,
        impact_level: impactLevel ? (impactLevel as ImpactLevel) : undefined,
        action_items: actionItems.length > 0 ? actionItems : undefined,
      };

      if (learning) {
        const result = await updateLearningAction(productId, learning.id, payload);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(String(result.error));
      } else {
        const result = await createLearningAction(productId, payload);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(String(result.error));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {errorMsg && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Learning Insight</h3>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <TextInput id="title" value={title} onChange={setTitle} disabled={isPending} placeholder="Summarize the learning..." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="insight">Insight</Label>
          <TextArea id="insight" value={insight} onChange={setInsight} disabled={isPending} placeholder="Describe the detailed observation or learning..." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="confidenceLevel">Confidence Level</Label>
            <Select id="confidenceLevel" value={confidenceLevel} onChange={setConfidenceLevel} options={CONFIDENCE_LEVELS} allowEmpty disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="impactLevel">Impact Level</Label>
            <Select id="impactLevel" value={impactLevel} onChange={setImpactLevel} options={IMPACT_LEVELS} allowEmpty disabled={isPending} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground">Source</h3>
        <p className="text-sm text-muted">Link this learning to the entity that generated it.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sourceType">Source Type</Label>
            <Select id="sourceType" value={sourceType} onChange={setSourceType} options={SOURCE_TYPES} allowEmpty disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourceId">Source ID</Label>
            <TextInput id="sourceId" value={sourceId} onChange={setSourceId} disabled={isPending} placeholder="UUID of the campaign, experiment, etc." />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground">Next Steps</h3>
        <div className="space-y-1.5">
          <Label htmlFor="actionItems">Action Items</Label>
          <TagInput id="actionItems" tags={actionItems} onChange={setActionItems} disabled={isPending} placeholder="Type an action and press Enter..." />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 text-sm text-foreground hover:bg-surface rounded-sm">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
          {isPending ? "Saving..." : learning ? "Save Changes" : "Create Learning"}
        </button>
      </div>
    </form>
  );
}
