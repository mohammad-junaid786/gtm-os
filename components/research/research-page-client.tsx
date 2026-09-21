"use client";

import { useEffect, useState, useCallback } from "react";
import { useProductContext } from "@/lib/product-context";
import { loadResearchItemsAction } from "@/lib/research/actions";
import { loadCompetitorsAction } from "@/lib/competitors/actions";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { ResearchList } from "./research-list";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="INTELLIGENCE"
        title="Research Library"
        description="Capture and organize market intelligence from articles, interviews, reports, and competitor analysis."
      />

      <ResearchList 
        productId={productId} 
        items={items} 
        competitors={competitors}
        onChanged={loadData} 
      />
    </div>
  );
}
