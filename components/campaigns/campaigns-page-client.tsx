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
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Campaigns</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Manage and track outbound and inbound campaigns.
        </p>
      </div>

      {state.status === "loading" && <p className="text-sm text-muted">Loading…</p>}
      {state.status === "error" && (
        <div role="alert" className="border border-border bg-surface/40 px-5 py-6 text-sm text-foreground">
          {state.message}
        </div>
      )}
      {state.status === "loaded" && <CampaignList productId={productId} campaigns={state.campaigns} />}
    </div>
  );
}
