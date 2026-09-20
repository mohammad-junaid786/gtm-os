"use client";

import { useEffect, useState } from "react";
import { loadCompetitorsAction } from "@/lib/competitors/actions";
import type { CompetitorRow } from "@/lib/competitors/types";
import { useProductContext } from "@/lib/product-context";
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
      <div className="flex h-32 items-center justify-center text-sm text-muted">
        Loading competitors...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Competitors</h1>
        <p className="mt-1 text-sm text-muted">
          Track and analyze your competitive landscape.
        </p>
      </div>

      <CompetitorList 
        productId={productId} 
        competitors={competitors} 
        onCompetitorsChange={setCompetitors} 
      />
    </div>
  );
}
