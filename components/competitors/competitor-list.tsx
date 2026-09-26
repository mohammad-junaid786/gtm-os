"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CompetitorRow } from "@/lib/competitors/types";
import { CompetitorCard } from "./competitor-card";
import { CompetitorForm } from "./competitor-form";
import { PageToolbar } from "@/components/ui/page-toolbar";

export function CompetitorList({
  productId,
  competitors,
  onCompetitorsChange,
}: {
  productId: string;
  competitors: CompetitorRow[];
  onCompetitorsChange: (competitors: CompetitorRow[]) => void;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorRow | null>(null);

  const handleCreateNew = () => {
    setEditingCompetitor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (competitor: CompetitorRow) => {
    setEditingCompetitor(competitor);
    setIsFormOpen(true);
  };

  const handleSave = (saved: CompetitorRow) => {
    if (editingCompetitor) {
      onCompetitorsChange(competitors.map((c) => (c.id === saved.id ? saved : c)));
    } else {
      onCompetitorsChange([...competitors, saved]);
    }
    setIsFormOpen(false);
  };

  const handleArchive = (id: string) => {
    onCompetitorsChange(competitors.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageToolbar
        start={<h2 className="text-lg font-medium text-foreground">Competitors ({competitors.length})</h2>}
        end={!isFormOpen && (
          <button
            onClick={handleCreateNew}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </button>
        )}
      />

      {competitors.length === 0 && !isFormOpen && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-24 px-6 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">No competitors tracked yet</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add competitors to map out your competitive landscape, tracking their strengths, weaknesses, and differentiators.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Competitor
            </button>
          </div>
        </div>
      )}

      {competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              productId={productId}
              competitor={competitor}
              onEdit={() => handleEdit(competitor)}
              onArchive={() => handleArchive(competitor.id)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <CompetitorForm
          productId={productId}
          competitor={editingCompetitor}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
