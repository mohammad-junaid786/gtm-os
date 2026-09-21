"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CompetitorRow } from "@/lib/competitors/types";
import { CompetitorCard } from "./competitor-card";
import { CompetitorForm } from "./competitor-form";

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
      <div className="flex justify-end">
        <button
          onClick={handleCreateNew}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </button>
      </div>

      {competitors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-medium text-foreground">No competitors tracked</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add competitors to map out your competitive landscape.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateNew}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Competitor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
