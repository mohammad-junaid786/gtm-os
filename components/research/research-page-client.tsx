"use client";

import { useEffect, useState, useCallback } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadResearchItemsAction } from "@/lib/research/actions";
import { loadCompetitorsAction } from "@/lib/competitors/actions";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { ResearchList } from "./research-list";

export function ResearchPageClient() {
  const { productId } = useProductContext();
  const [items, setItems] = useState<ResearchItemRow[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [researchRes, compRes] = await Promise.all([
        loadResearchItemsAction(productId),
        loadCompetitorsAction(productId),
      ]);

      if (!researchRes.ok) {
        setError(researchRes.error.message);
        return;
      }
      if (!compRes.ok) {
        setError(compRes.error.message);
        return;
      }

      setItems(researchRes.data);
      setCompetitors(compRes.data);
    } catch (err) {
      setError("An unexpected error occurred loading research data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading research...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Research Library</h1>
        <p className="text-muted-foreground mt-2">
          Structured insights from articles, interviews, reports, and competitor analysis.
        </p>
      </div>

      <ResearchList 
        productId={productId} 
        items={items} 
        competitors={competitors}
        onChanged={loadData} 
      />
    </div>
  );
}
