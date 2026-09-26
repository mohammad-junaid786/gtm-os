"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { ResearchCard } from "./research-card";
import { ResearchForm } from "./research-form";
import { ContextualLearningDialog } from "@/components/learnings/contextual-learning-dialog";

import { PageToolbar } from "@/components/ui/page-toolbar";

interface ResearchListProps {
  productId: string;
  items: ResearchItemRow[];
  competitors: CompetitorRow[];
  onChanged: () => void;
}

export function ResearchList({ productId, items, competitors, onChanged }: ResearchListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [learningResearch, setLearningResearch] = useState<ResearchItemRow | null>(null);

  const handleCreateNew = () => setIsCreating(true);
  const handleCancelCreate = () => setIsCreating(false);

  const handleSuccess = () => {
    setIsCreating(false);
    onChanged();
  };

  return (
    <div className="space-y-6">
      <PageToolbar
        start={<h2 className="text-lg font-medium text-foreground">Research & Intelligence ({items.length})</h2>}
        end={!isCreating && (
          <button
            onClick={handleCreateNew}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Research
          </button>
        )}
      />

      {items.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-24 px-6 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">No research logged yet</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Capture interviews, industry reports, and competitor intelligence.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Research
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {items.map((item) => (
            <ResearchCard
              key={item.id}
              productId={productId}
              item={item}
              competitors={competitors}
              onChanged={onChanged}
              onLogLearning={() => setLearningResearch(item)}
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

      {learningResearch && (
        <ContextualLearningDialog
          open={!!learningResearch}
          onOpenChange={(open) => {
            if (!open) setLearningResearch(null);
          }}
          productId={productId}
          sourceType="research"
          sourceId={learningResearch.id}
          sourceDisplayName={learningResearch.title}
          sourceContext={
            [
              learningResearch.type ? `Type: ${learningResearch.type.replace("_", " ")}` : null,
              learningResearch.date_researched ? `Date: ${learningResearch.date_researched}` : null,
            ].filter(Boolean).join("\n") || undefined
          }
          onSuccess={() => setLearningResearch(null)}
        />
      )}
    </div>
  );
}
