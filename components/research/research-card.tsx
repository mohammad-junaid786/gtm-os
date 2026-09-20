"use client";

import { useState } from "react";
import { ExternalLink, Edit2, Archive, FileText, Calendar, Building, Type } from "lucide-react";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { archiveResearchItemAction } from "@/lib/research/actions";
import { ResearchForm } from "./research-form";

export function ResearchCard({
  productId,
  item,
  competitors,
  onChanged,
}: {
  productId: string;
  item: ResearchItemRow;
  competitors: CompetitorRow[];
  onChanged: () => void;
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
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
      <div className="flex flex-row items-start justify-between p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-semibold leading-none tracking-tight">{item.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Type className="h-3.5 w-3.5" />
              <span className="capitalize">{item.type.replace("_", " ")}</span>
            </div>
            {item.date_researched && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{item.date_researched}</span>
              </div>
            )}
            {linkedCompetitor && (
              <div className="flex items-center gap-1 text-primary/80">
                <Building className="h-3.5 w-3.5" />
                <span>{linkedCompetitor}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            title="Edit"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            title="Archive"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-red-500"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6 pt-0 flex-1 flex flex-col gap-4">
        {item.content && (
          <div className="bg-muted/30 rounded-md p-4 text-sm whitespace-pre-wrap flex-1 border">
            {item.content}
          </div>
        )}
        
        {(item.source_name || item.source_url) && (
          <div className="flex flex-col gap-2 pt-2 mt-auto border-t">
            <div className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Source
            </div>
            {item.source_name && (
              <span className="text-sm text-muted-foreground">{item.source_name}</span>
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
        )}
      </div>
    </div>
  );
}
