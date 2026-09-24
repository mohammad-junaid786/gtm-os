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
      <div className="py-2">
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
    ? competitors.find((c) => c.id === item.competitor_id)?.name || "Unknown/Archived Competitor" 
    : null;

  return (
    <div className="flex flex-col py-6 border-b border-border last:border-0">
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1 uppercase tracking-widest">
              <span>{item.type.replace("_", " ")}</span>
            </div>
            {item.date_researched && (
              <div className="flex items-center gap-1">
                <span>{item.date_researched}</span>
              </div>
            )}
            {linkedCompetitor && (
              <div className="flex items-center gap-1 text-foreground">
                <Building className="h-3 w-3" />
                <span>{linkedCompetitor}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogLearning}
            className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground font-medium"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Log Learning</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            title="Edit"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchive}
            disabled={isArchiving}
            title="Archive"
            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex-1 flex flex-col gap-4">
        {item.content && (
          <div className="text-sm whitespace-pre-wrap flex-1 text-foreground/90 font-serif leading-relaxed max-w-[85ch]">
            {item.content}
          </div>
        )}
        
        {(item.source_name || item.source_url) && (
          <div className="flex flex-col gap-1.5 pt-4 mt-2">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
              Source
            </div>
            <div className="flex items-center gap-3">
              {item.source_name && (
                <span className="text-sm font-medium text-foreground">{item.source_name}</span>
              )}
              {item.source_url && (
                <a 
                  href={item.source_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center break-all"
                >
                  {item.source_url}
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
