"use client";

import { useState } from "react";
import { Edit2, Archive, Globe, Tag } from "lucide-react";
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
    <div className="flex flex-col h-full rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Identity */}
      <div className="flex items-start justify-between bg-primary p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-white">{competitor.name}</h3>
          {(competitor.category || competitor.website) && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/80 mt-1">
              {competitor.category && (
                <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                  <Tag className="h-3 w-3" />
                  {competitor.category}
                </span>
              )}
              {competitor.website && (
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors font-mono"
                >
                  <Globe className="h-3 w-3" />
                  {competitor.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            title="Edit"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white text-sm font-medium shadow-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            title="Archive"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-white/70 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            {isArchiving ? "..." : <Archive className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-6 space-y-8">
        {/* Competitive Context */}
        {competitor.description && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Overview</h4>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {competitor.description}
            </p>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        {(competitor.strengths?.length || competitor.weaknesses?.length) ? (
          <div className="grid grid-cols-2 gap-4">
            {competitor.strengths && competitor.strengths.length > 0 && (
              <div className="rounded-lg border border-border bg-surface-subtle p-3.5">
                <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                  Strengths
                </h4>
                <ul className="space-y-1.5">
                  {competitor.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                      <span className="text-muted-foreground mt-1 shrink-0">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {competitor.weaknesses && competitor.weaknesses.length > 0 && (
              <div className="rounded-lg border border-border bg-surface-subtle p-3.5">
                <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  Weaknesses
                </h4>
                <ul className="space-y-1.5">
                  {competitor.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                      <span className="text-muted-foreground mt-1 shrink-0">·</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Strategic Notes — How We Win */}
        {competitor.differentiators && competitor.differentiators.length > 0 && (
          <div>
            <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              How We Win
            </h4>
            <ul className="space-y-1.5">
              {competitor.differentiators.map((d, i) => (
                <li key={i} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
                  <span className="text-primary/60 mt-0.5 shrink-0">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {competitor.pricing_notes && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pricing & Business Model</h4>
            <div className="rounded-lg bg-surface-subtle border border-border-subtle p-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {competitor.pricing_notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
