"use client";

import { useState } from "react";
import { ExternalLink, Edit2, Archive, Globe, Tag } from "lucide-react";
import type { CompetitorRow } from "@/lib/competitors/types";
import { archiveCompetitorAction } from "@/lib/competitors/actions";

export function CompetitorCard({
  productId,
  competitor,
  onEdit,
  onArchive,
}: {
  productId: string;
  competitor: CompetitorRow;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this competitor?")) return;
    setIsArchiving(true);
    const result = await archiveCompetitorAction(productId, competitor.id);
    if (result.ok) {
      onArchive();
    } else {
      alert(`Failed to archive: ${result.error.message}`);
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between p-6 pb-4">
        <div className="space-y-1.5">
          <h3 className="font-semibold leading-none tracking-tight">{competitor.name}</h3>
          {(competitor.category || competitor.website) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
              {competitor.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {competitor.category}
                </span>
              )}
              {competitor.website && (
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            title="Edit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            title="Archive"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-red-500"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6 pt-0 flex-grow space-y-4">
        {competitor.description && (
          <div>
            <h4 className="text-sm font-medium mb-1.5">Overview</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {competitor.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {competitor.strengths && competitor.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1.5 text-green-600 dark:text-green-500">Strengths</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {competitor.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {competitor.weaknesses && competitor.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1.5 text-red-600 dark:text-red-500">Weaknesses</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {competitor.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {competitor.differentiators && competitor.differentiators.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1.5 text-blue-600 dark:text-blue-500">How We Win</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {competitor.differentiators.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {competitor.pricing_notes && (
          <div>
            <h4 className="text-sm font-medium mb-1.5">Pricing & Business Model</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {competitor.pricing_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
