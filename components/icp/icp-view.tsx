"use client";

/**
 * IcpView — renders the saved ICP and toggles to the edit form.
 *
 * This is a client component so it can manage the edit/view toggle state
 * locally without a page reload.
 *
 * Server→client boundary:
 *   The parent server component fetches the IcpRow and passes it as a prop.
 *   Mutations go through Server Actions — no direct DB access here.
 */

import { useState } from "react";
import type { IcpRow } from "@/lib/icp/types";
import { IcpForm } from "@/components/icp/icp-form";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium tracking-[0.08em] text-muted uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] | null | undefined }) {
  if (!values || values.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
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
// IcpView
// ---------------------------------------------------------------------------

export function IcpView({
  icp: initialIcp,
  productId,
}: {
  icp: IcpRow;
  productId: string;
}) {
  const [icp, setIcp] = useState<IcpRow>(initialIcp);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <IcpForm
        productId={productId}
        icp={icp}
        onSuccess={(saved) => {
          setIcp(saved);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const hasAnyFirmographics =
    icp.industry || icp.company_size || icp.geography || icp.business_model;
  const hasAnySignals =
    (icp.pain_points?.length ?? 0) > 0 ||
    (icp.goals?.length ?? 0) > 0 ||
    (icp.buying_signals?.length ?? 0) > 0 ||
    (icp.disqualifiers?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{icp.name}</h2>
          {icp.description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted">{icp.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "shrink-0 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-muted",
            "hover:border-foreground/20 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          )}
        >
          Edit
        </button>
      </div>

      {/* Firmographics */}
      {hasAnyFirmographics && (
        <Section title="Firmographics">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Industry" value={icp.industry} />
            <Field label="Company size" value={icp.company_size} />
            <Field label="Geography" value={icp.geography} />
            <Field
              label="Business model"
              value={icp.business_model?.toUpperCase() ?? null}
            />
          </div>
        </Section>
      )}

      {/* Needs & Signals */}
      {hasAnySignals && (
        <Section title="Needs &amp; Signals">
          <div className="space-y-4">
            <TagList label="Pain points" values={icp.pain_points} />
            <TagList label="Goals / outcomes" values={icp.goals} />
            <TagList label="Buying signals" values={icp.buying_signals} />
            <TagList label="Disqualifiers" values={icp.disqualifiers} />
          </div>
        </Section>
      )}

      {/* Notes */}
      {icp.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {icp.notes}
          </p>
        </Section>
      )}

      {/* Metadata */}
      <p className="text-xs text-muted">
        Last updated {icp.updated_at.toLocaleDateString(undefined, { dateStyle: "medium" })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IcpEmpty — shown when no ICP exists yet
// ---------------------------------------------------------------------------

export function IcpEmpty({
  productId,
  onCreated,
}: {
  productId: string;
  onCreated: (icp: IcpRow) => void;
}) {
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <IcpForm
        productId={productId}
        onSuccess={onCreated}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-border bg-surface/40 px-5 py-10">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No ICP defined yet</p>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          An Ideal Customer Profile describes the type of company that gets the most value from
          your product and is most likely to buy. Define yours to align your go-to-market strategy.
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
        Define ICP
      </button>
    </div>
  );
}
