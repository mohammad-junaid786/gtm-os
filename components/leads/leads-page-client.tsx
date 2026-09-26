"use client";

import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadLeadsAction } from "@/lib/leads/actions";
import { LeadList } from "./lead-list";
import type { LeadRow } from "@/lib/leads/types";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; leads: LeadRow[] }
  | { status: "error"; message: string };

import { PageHeader } from "@/components/ui/page-header";

export function LeadsPageClient() {
  const { productId } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadLeadsAction(productId).then((res) => {
      if (cancelled) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "loaded", leads: res.data });
    });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="EXECUTION"
        title="Leads"
        description="Lightweight target accounts and contacts for outbound execution."
      />

      {state.status === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.status === "error" && (
        <div role="alert" className="border border-border bg-surface/40 px-5 py-6 text-sm text-foreground">
          {state.message}
        </div>
      )}
      {state.status === "loaded" && <LeadList productId={productId} leads={state.leads} />}
    </div>
  );
}
