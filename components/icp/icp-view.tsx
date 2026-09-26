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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <span className="font-medium text-foreground">{value}</span>
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
          <div className="flex flex-wrap gap-2 mt-1">
            {values.map((v, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal capitalize">
                {v}
              </Badge>
            ))}
          </div>
        )}
      </DescriptionListDetails>
    </DescriptionListItem>
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
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-foreground">Edit Ideal Customer Profile</h3>
        <IcpForm
          productId={productId}
          icp={icp}
          onSuccess={(saved) => {
            setIcp(saved);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
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
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="p-8 space-y-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{icp.name}</h2>
            {icp.description && (
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                {icp.description}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            Edit Profile
          </Button>
        </div>

        <div className="space-y-10">
          {/* Firmographics */}
          {hasAnyFirmographics && (
            <Section title="Firmographics">
              <DescriptionList className="sm:grid-cols-2 md:grid-cols-4 gap-y-8">
                <Field label="Industry" value={icp.industry} />
                <Field label="Company size" value={icp.company_size} />
                <Field label="Geography" value={icp.geography} />
                <Field label="Business model" value={icp.business_model?.toUpperCase() ?? null} />
              </DescriptionList>
            </Section>
          )}

          {/* Needs & Signals */}
          {hasAnySignals && (
            <Section title="Needs & Signals">
              <DescriptionList className="sm:grid-cols-2 gap-y-8 gap-x-12">
                <TagList label="Pain points" values={icp.pain_points} />
                <TagList label="Goals & outcomes" values={icp.goals} />
                <TagList label="Buying signals" values={icp.buying_signals} />
                <TagList label="Disqualifiers" values={icp.disqualifiers} />
              </DescriptionList>
            </Section>
          )}

          {/* Notes */}
          {icp.notes && (
            <Section title="Additional Notes">
              <div className="rounded-lg bg-surface-subtle p-5 border border-border-subtle">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {icp.notes}
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-muted/20 px-8 py-4">
        <p className="text-xs text-muted-foreground">
          Last updated on {icp.updated_at.toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
      </div>
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
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-foreground">Define Ideal Customer Profile</h3>
        <IcpForm
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
        <h3 className="text-lg font-semibold text-foreground">No ICP defined yet</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          An Ideal Customer Profile describes the type of company that gets the most value from
          your product and is most likely to buy. Define yours to align your go-to-market strategy.
        </p>
        <Button onClick={() => setCreating(true)} className="mt-4">
          Define Ideal Customer Profile
        </Button>
      </div>
    </div>
  );
}
