"use client";

import { useState, useTransition, useRef } from "react";
import { createPersonaAction, updatePersonaAction } from "@/lib/personas/actions";
import type { PersonaRow } from "@/lib/personas/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

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
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
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
              aria-label="Remove"
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

// ---------------------------------------------------------------------------
// Main Form Component
// ---------------------------------------------------------------------------

export function PersonaForm({
  productId,
  icpId,
  persona,
  onSuccess,
  onCancel,
}: {
  productId: string;
  icpId: string;
  persona?: PersonaRow;
  onSuccess: (persona: PersonaRow) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState(persona?.name ?? "");
  const [role, setRole] = useState(persona?.role ?? "");
  const [goals, setGoals] = useState<string[]>(persona?.goals ?? []);
  const [painPoints, setPainPoints] = useState<string[]>(persona?.pain_points ?? []);
  const [motivations, setMotivations] = useState<string[]>(persona?.motivations ?? []);
  const [objections, setObjections] = useState<string[]>(persona?.objections ?? []);
  const [decisionCriteria, setDecisionCriteria] = useState<string[]>(persona?.decision_criteria ?? []);
  const [preferredChannels, setPreferredChannels] = useState<string[]>(persona?.preferred_channels ?? []);
  const [messagingAngles, setMessagingAngles] = useState<string[]>(persona?.messaging_angles ?? []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedRole = role.trim();

    if (!trimmedName || !trimmedRole) {
      setErrorMsg("Name and Role are required.");
      return;
    }

    startTransition(async () => {
      if (persona) {
        // Update existing
        const result = await updatePersonaAction(productId, icpId, persona.id, {
          name: trimmedName,
          role: trimmedRole,
          goals: goals.length > 0 ? goals : undefined,
          pain_points: painPoints.length > 0 ? painPoints : undefined,
          motivations: motivations.length > 0 ? motivations : undefined,
          objections: objections.length > 0 ? objections : undefined,
          decision_criteria: decisionCriteria.length > 0 ? decisionCriteria : undefined,
          preferred_channels: preferredChannels.length > 0 ? preferredChannels : undefined,
          messaging_angles: messagingAngles.length > 0 ? messagingAngles : undefined,
        });
        if (result.ok) {
          onSuccess(result.data);
        } else {
          setErrorMsg(result.error.message);
        }
      } else {
        // Create new
        const result = await createPersonaAction(productId, {
          icpId,
          name: trimmedName,
          role: trimmedRole,
          goals: goals.length > 0 ? goals : undefined,
          pain_points: painPoints.length > 0 ? painPoints : undefined,
          motivations: motivations.length > 0 ? motivations : undefined,
          objections: objections.length > 0 ? objections : undefined,
          decision_criteria: decisionCriteria.length > 0 ? decisionCriteria : undefined,
          preferred_channels: preferredChannels.length > 0 ? preferredChannels : undefined,
          messaging_angles: messagingAngles.length > 0 ? messagingAngles : undefined,
        });
        if (result.ok) {
          onSuccess(result.data);
        } else {
          setErrorMsg(result.error.message);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="personaName">Persona Name</Label>
            <TextInput
              id="personaName"
              value={name}
              onChange={setName}
              placeholder="e.g. The Champion, The Economic Buyer"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personaRole">Role / Title</Label>
            <TextInput
              id="personaRole"
              value={role}
              onChange={setRole}
              placeholder="e.g. VP of Engineering, CTO"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Psychology */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Psychology & Needs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="personaGoals">Goals</Label>
            <TagInput
              id="personaGoals"
              values={goals}
              onChange={setGoals}
              placeholder="Type and press Enter…"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personaPainPoints">Pain Points</Label>
            <TagInput
              id="personaPainPoints"
              values={painPoints}
              onChange={setPainPoints}
              placeholder="Type and press Enter…"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personaMotivations">Motivations</Label>
            <TagInput
              id="personaMotivations"
              values={motivations}
              onChange={setMotivations}
              placeholder="Type and press Enter…"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personaObjections">Common Objections</Label>
            <TagInput
              id="personaObjections"
              values={objections}
              onChange={setObjections}
              placeholder="Type and press Enter…"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Buying Process */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Buying Process</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="personaDecisionCriteria">Decision Criteria</Label>
            <TagInput
              id="personaDecisionCriteria"
              values={decisionCriteria}
              onChange={setDecisionCriteria}
              placeholder="Type and press Enter…"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personaChannels">Preferred Channels</Label>
            <TagInput
              id="personaChannels"
              values={preferredChannels}
              onChange={setPreferredChannels}
              placeholder="e.g. LinkedIn, Email, Events…"
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="personaMessaging">Messaging Angles</Label>
          <TagInput
            id="personaMessaging"
            values={messagingAngles}
            onChange={setMessagingAngles}
            placeholder="Type and press Enter…"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-sm px-4 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : persona ? "Save Changes" : "Create Persona"}
        </button>
      </div>
    </form>
  );
}
