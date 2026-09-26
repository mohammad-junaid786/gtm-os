"use client";

import { useEffect, useState } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadCampaignsAction } from "@/lib/campaigns/actions";
import { CampaignList } from "./campaign-list";
import type { CampaignRow } from "@/lib/campaigns/types";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; campaigns: CampaignRow[] }
  | { status: "error"; message: string };

import { PageHeader } from "@/components/ui/page-header";

export function CampaignsPageClient() {
  const { productId } = useProductContext();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadCampaignsAction(productId).then((res) => {
      if (cancelled) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "loaded", campaigns: res.data });
    });
    return () => { cancelled = true; };
  }, [productId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="EXECUTION"
        title="Campaigns"
        description="Manage and track outbound and inbound campaigns."
      />

      {state.status === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.status === "error" && (
        <div role="alert" className="border border-border bg-surface/40 px-5 py-6 text-sm text-foreground">
          {state.message}
        </div>
      )}
      {state.status === "loaded" && <CampaignList productId={productId} campaigns={state.campaigns} />}
    </div>
  );
}
