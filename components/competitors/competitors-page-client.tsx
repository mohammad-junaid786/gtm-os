"use client";

import { useEffect, useState } from "react";
import { loadCompetitorsAction } from "@/lib/competitors/actions";
import type { CompetitorRow } from "@/lib/competitors/types";
import { useProductContext } from "@/lib/product-context";
import { PageHeader } from "@/components/ui/page-header";
import { CompetitorList } from "./competitor-list";

export function CompetitorsPageClient() {
  const { productId } = useProductContext();
  const [competitors, setCompetitors] = useState<CompetitorRow[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadCompetitorsAction(productId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setCompetitors(result.data);
      } else {
        setErrorMsg(result.error.message || "Failed to load competitors.");
      }
    });
    return () => {
      active = false;
    };
  }, [productId]);

  if (errorMsg) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-600">
        Error loading competitors: {errorMsg}
      </div>
    );
  }

  if (competitors === null) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading competitors...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="STRATEGY"
        title="Competitors"
        description="Track and analyze your competitive landscape to understand your unique differentiators."
      />

      <CompetitorList 
        productId={productId} 
        competitors={competitors} 
        onCompetitorsChange={setCompetitors} 
      />
    </div>
  );
}
