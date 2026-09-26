"use client";

import { useState } from "react";
import { ExternalLink, Edit2, Archive, Building, Lightbulb } from "lucide-react";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { archiveResearchItemAction } from "@/lib/research/actions";
import { ResearchForm } from "./research-form";
import { Button } from "@/components/ui/button";

export function ResearchCard({
  productId,
  item,
  competitors,
  onChanged,
  onLogLearning,
}: {
  productId: string;
  item: ResearchItemRow;
  competitors: CompetitorRow[];
  onChanged: () => void;
  onLogLearning: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this research item?")) return;
    setIsArchiving(true);
    try {
      const res = await archiveResearchItemAction(productId, item.id);
      if (res.ok) {
        onChanged();
      } else {
        alert(res.error.message);
      }
    } catch {
      alert("Failed to archive research item.");
    } finally {
      setIsArchiving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-foreground">Edit Research</h3>
        <ResearchForm
          productId={productId}
          item={item}
          competitors={competitors}
          onSuccess={() => {
            setIsEditing(false);
            onChanged();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Find linked competitor name if it exists (might be active or archived)
  const linkedCompetitor = item.competitor_id
    ? competitors.find((c) => c.id === item.competitor_id)?.name || "Archived Competitor"
    : null;

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Header / Identity */}
      <div className="flex flex-col bg-primary p-5 gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 pr-4">
            <h3 className="text-base font-semibold leading-tight tracking-tight text-white">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px] text-white/80">
              <span className="font-medium">{item.type.replace("_", " ")}</span>
              {item.date_researched && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="font-mono">{item.date_researched}</span>
                </>
              )}
              {linkedCompetitor && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="flex items-center gap-1 text-white">
                    <Building className="h-3 w-3" />
                    {linkedCompetitor}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions — icon-only row; Log Learning is secondary */}
          <div className="flex gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogLearning}
              title="Log Learning"
              className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
            >
              <Lightbulb className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              title="Edit"
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              title="Archive"
              className="h-8 w-8 p-0 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {isArchiving ? "..." : <Archive className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-6 space-y-6">
        {item.content && (
          <div className="text-sm whitespace-pre-wrap flex-1 text-foreground/90 font-serif leading-relaxed max-w-full">
            {item.content}
          </div>
        )}

        {(item.source_name || item.source_url) && (
          <div className="flex flex-col gap-1.5 pt-4 border-t border-border/50">
            <h4 className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Source
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              {item.source_name && (
                <span className="text-sm font-medium text-foreground">{item.source_name}</span>
              )}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center break-all font-mono"
                >
                  {item.source_url.replace(/^https?:\/\//, '')}
                  <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
