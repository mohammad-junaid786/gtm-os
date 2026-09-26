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
import { Button } from "@/components/ui/button";
import {
  DescriptionList,
  DescriptionListItem,
  DescriptionListTerm,
  DescriptionListDetails,
} from "@/components/ui/description-list";

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6 pt-8 first:pt-0">
      <h3 className="text-sm font-semibold tracking-tight text-foreground border-b border-border pb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <DescriptionListItem>
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDetails>
        {value ? (
          <span className="text-foreground leading-relaxed block">{value}</span>
        ) : (
          <span className="text-muted-foreground italic">Not specified</span>
        )}
      </DescriptionListDetails>
    </DescriptionListItem>
  );
}

function TagList({ label, values }: { label: string; values: string[] | null | undefined }) {
  return (
    <DescriptionListItem className="sm:col-span-2">
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDetails>
        {!values || values.length === 0 ? (
          <span className="text-muted-foreground italic">Not specified</span>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            {values.map((v, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface-subtle p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground pt-0.5 leading-relaxed">{v}</span>
              </div>
            ))}
          </div>
        )}
      </DescriptionListDetails>
    </DescriptionListItem>
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
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-foreground">Edit Positioning</h3>
        <PositioningForm
          productId={productId}
          positioning={pos}
          onSuccess={(saved) => {
            setPos(saved);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const hasCustomerContext = pos.target_customer || pos.customer_problem;
  const hasDifferentiation = pos.unique_value;
  const hasProofPoints = (pos.proof_points?.length ?? 0) > 0;
  const hasAlternatives = (pos.alternatives?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="p-8 space-y-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Positioning Strategy</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            Edit Strategy
          </Button>
        </div>

        {/* Positioning Statement (Primary Focus) */}
        {pos.positioning_statement && (
          <div className="rounded-xl bg-primary/5 p-6 md:p-8 border border-primary/10">
            <h3 className="text-[11px] font-semibold tracking-wider uppercase text-primary/80 mb-3">
              Core Positioning Statement
            </h3>
            <p className="text-lg md:text-xl font-medium leading-relaxed text-foreground">
              &ldquo;{pos.positioning_statement}&rdquo;
            </p>
          </div>
        )}

        <div className="space-y-10">
          {/* Customer & Problem */}
          {hasCustomerContext && (
            <Section title="Customer & Context">
              <DescriptionList className="gap-y-8 gap-x-12">
                <Field label="Target Customer" value={pos.target_customer} />
                <Field label="Customer Problem" value={pos.customer_problem} />
              </DescriptionList>
            </Section>
          )}

          {/* Differentiation */}
          {hasDifferentiation && (
            <Section title="Differentiation">
              <DescriptionList className="gap-y-8">
                <Field label="Unique Value Proposition" value={pos.unique_value} />
              </DescriptionList>
            </Section>
          )}

          {/* Proof Points & Alternatives */}
          {(hasProofPoints || hasAlternatives) && (
            <Section title="Market Reality">
              <DescriptionList className="gap-y-10 gap-x-12">
                {hasProofPoints && <TagList label="Reasons to Believe (Proof Points)" values={pos.proof_points} />}
                {hasAlternatives && <TagList label="Competitive Alternatives" values={pos.alternatives} />}
              </DescriptionList>
            </Section>
          )}

          {/* Notes */}
          {pos.notes && (
            <Section title="Additional Notes">
              <div className="rounded-lg bg-surface-subtle p-5 border border-border-subtle">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {pos.notes}
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-muted/20 px-8 py-4">
        <p className="text-xs text-muted-foreground">
          Last updated on {pos.updated_at.toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
      </div>
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
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-foreground">Define Positioning</h3>
        <PositioningForm
          productId={productId}
          onSuccess={onCreated}
          onCancel={() => setCreating(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-24 px-6 text-center shadow-sm">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold text-foreground">No positioning defined yet</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Positioning defines who your product is for, what problem it solves, and why
          it is uniquely valuable. A clear positioning statement aligns your team and
          strengthens every go-to-market motion.
        </p>
        <Button onClick={() => setCreating(true)} className="mt-4">
          Define Positioning
        </Button>
      </div>
    </div>
  );
}