"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { ResearchCard } from "./research-card";
import { ResearchForm } from "./research-form";

interface ResearchListProps {
  productId: string;
  items: ResearchItemRow[];
  competitors: CompetitorRow[];
  onChanged: () => void;
}

export function ResearchList({ productId, items, competitors, onChanged }: ResearchListProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => setIsCreating(true);
  const handleCancelCreate = () => setIsCreating(false);

  const handleSuccess = () => {
    setIsCreating(false);
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleCreateNew}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Research
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-card shadow-sm">
          <h3 className="text-lg font-semibold">No research logged yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Capture interviews, industry reports, and competitor intelligence.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateNew}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Research
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <ResearchCard
              key={item.id}
              productId={productId}
              item={item}
              competitors={competitors}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}

      {isCreating && (
        <ResearchForm
          productId={productId}
          competitors={competitors}
          onSuccess={handleSuccess}
          onCancel={handleCancelCreate}
        />
      )}
    </div>
  );
}
