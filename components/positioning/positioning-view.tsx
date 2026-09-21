"use client";

/**
 * PositioningView — renders the saved positioning record in read mode.
 *
 * This is a client component so it can manage the edit/view toggle state
 * locally without a page reload.
 *
 * Server->client boundary:
 *   The parent client component fetches the PositioningRow via a server action
 *   and passes it as a prop. Mutations go through Server Actions — no direct
 *   DB access here.
 */

import { useState } from "react";
import type { PositioningRow } from "@/lib/positioning/types";
import { PositioningForm } from "@/components/positioning/positioning-form";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Display helpers (same pattern as icp-view.tsx)
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] | null | undefined }) {
  if (!values || values.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-block rounded-sm border border-border bg-surface/60 px-2 py-0.5 text-xs text-foreground"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PositioningView
// ---------------------------------------------------------------------------

export function PositioningView({
  positioning: initialPositioning,
  productId,
}: {
  positioning: PositioningRow;
  productId: string;
}) {
  const [pos, setPos] = useState<PositioningRow>(initialPositioning);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PositioningForm
        productId={productId}
        positioning={pos}
        onSuccess={(saved) => {
          setPos(saved);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const hasCustomerContext = pos.target_customer || pos.customer_problem;
  const hasDifferentiation = pos.unique_value;
  const hasProofPoints = (pos.proof_points?.length ?? 0) > 0;
  const hasAlternatives = (pos.alternatives?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">Positioning</h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "shrink-0 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground",
            "hover:border-foreground/20 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          )}
        >
          Edit
        </button>
      </div>

      {/* Positioning Statement (shown as a standalone section if present but also in header) */}
      {pos.positioning_statement && (
        <Section title="Positioning Statement">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/90 italic">
            {pos.positioning_statement}
          </p>
        </Section>
      )}

      {/* Customer & Problem */}
      {hasCustomerContext && (
        <Section title="Customer & Problem">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target customer" value={pos.target_customer} />
            <Field label="Customer problem" value={pos.customer_problem} />
          </div>
        </Section>
      )}

      {/* Differentiation */}
      {hasDifferentiation && (
        <Section title="Unique Value">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">
            {pos.unique_value}
          </p>
        </Section>
      )}

      {/* Proof Points */}
      {hasProofPoints && (
        <Section title="Proof Points">
          <TagList label="Reasons to believe" values={pos.proof_points} />
        </Section>
      )}

      {/* Alternatives */}
      {hasAlternatives && (
        <Section title="Alternatives">
          <TagList label="Competitive alternatives" values={pos.alternatives} />
        </Section>
      )}

      {/* Notes */}
      {pos.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {pos.notes}
          </p>
        </Section>
      )}

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Last updated {pos.updated_at.toLocaleDateString(undefined, { dateStyle: "medium" })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PositioningEmpty — shown when no positioning exists yet
// ---------------------------------------------------------------------------

export function PositioningEmpty({
  productId,
  onCreated,
}: {
  productId: string;
  onCreated: (positioning: PositioningRow) => void;
}) {
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <PositioningForm
        productId={productId}
        onSuccess={onCreated}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-border bg-surface/40 px-5 py-10">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No positioning defined yet</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Positioning defines who your product is for, what problem it solves, and why
          it is uniquely valuable. A clear positioning statement aligns your team and
          strengthens every go-to-market motion.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setCreating(true)}
        className={cn(
          "rounded-sm border border-border bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground",
          "hover:bg-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring",
        )}
      >
        Define Positioning
      </button>
    </div>
  );
}