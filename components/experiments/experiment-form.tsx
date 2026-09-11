"use client";

import { useState, useTransition, useRef } from "react";
import { createExperimentAction, updateExperimentAction } from "@/lib/experiments/actions";
import { EXPERIMENT_STATUSES } from "@/lib/experiments/types";
import type { ExperimentRow, ExperimentStatus } from "@/lib/experiments/types";
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
        "w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="number"
      value={value === "" ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
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
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
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
              className="ml-0.5 text-muted hover:text-foreground"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        disabled={disabled}
        placeholder={values.length === 0 ? placeholder : undefined}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
      />
    </div>
  );
}

export function ExperimentForm({
  productId,
  experiment,
  onSuccess,
  onCancel,
}: {
  productId: string;
  experiment?: ExperimentRow;
  onSuccess: (experiment: ExperimentRow) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState(experiment?.name ?? "");
  const [hypothesis, setHypothesis] = useState(experiment?.hypothesis ?? "");
  const [goal, setGoal] = useState(experiment?.goal ?? "");
  const [audience, setAudience] = useState(experiment?.audience ?? "");
  const [channel, setChannel] = useState(experiment?.channel ?? "");
  const [variant, setVariant] = useState(experiment?.variant ?? "");
  const [primaryMetric, setPrimaryMetric] = useState(experiment?.primary_metric ?? "");
  const [secondaryMetrics, setSecondaryMetrics] = useState<string[]>(experiment?.secondary_metrics ?? []);
  const [budgetDollars, setBudgetDollars] = useState<number | "">(
    experiment?.budget != null ? experiment.budget / 100 : ""
  );
  const [status, setStatus] = useState<ExperimentStatus>((experiment?.status as ExperimentStatus) ?? "Idea");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Experiment name is required.");
      return;
    }

    startTransition(async () => {
      const budget = budgetDollars === "" ? undefined : Math.round(budgetDollars * 100);

      const input = {
        name: trimmedName,
        hypothesis: hypothesis.trim() || undefined,
        goal: goal.trim() || undefined,
        audience: audience.trim() || undefined,
        channel: channel.trim() || undefined,
        variant: variant.trim() || undefined,
        primary_metric: primaryMetric.trim() || undefined,
        secondary_metrics: secondaryMetrics.length > 0 ? secondaryMetrics : undefined,
        budget,
        status,
      };

      if (experiment) {
        const result = await updateExperimentAction(productId, experiment.id, input);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      } else {
        const result = await createExperimentAction(productId, input);
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Experiment Name</Label>
            <TextInput id="name" value={name} onChange={setName} disabled={isPending} placeholder="Pricing page CTA test" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hypothesis">Hypothesis</Label>
            <Textarea id="hypothesis" value={hypothesis} onChange={setHypothesis} disabled={isPending} placeholder="If we change the CTA color, then conversion will increase." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">Goal</Label>
            <TextInput id="goal" value={goal} onChange={setGoal} disabled={isPending} placeholder="Increase signups" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" value={status} onChange={(v) => setStatus(v as ExperimentStatus)} options={EXPERIMENT_STATUSES} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">Audience</Label>
            <TextInput id="audience" value={audience} onChange={setAudience} disabled={isPending} placeholder="US SMBs" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="channel">Channel</Label>
            <TextInput id="channel" value={channel} onChange={setChannel} disabled={isPending} placeholder="Website" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant">Variant</Label>
            <TextInput id="variant" value={variant} onChange={setVariant} disabled={isPending} placeholder="Red CTA button" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget ($)</Label>
            <NumberInput id="budget" value={budgetDollars} onChange={setBudgetDollars} disabled={isPending} placeholder="500" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="primaryMetric">Primary Metric</Label>
            <TextInput id="primaryMetric" value={primaryMetric} onChange={setPrimaryMetric} disabled={isPending} placeholder="Conversion Rate" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="secondaryMetrics">Secondary Metrics</Label>
            <TagInput id="secondaryMetrics" values={secondaryMetrics} onChange={setSecondaryMetrics} disabled={isPending} placeholder="Type and press Enter" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 text-sm text-foreground hover:bg-surface rounded-sm">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
          {isPending ? "Saving..." : experiment ? "Save Changes" : "Create Experiment"}
        </button>
      </div>
    </form>
  );
}
