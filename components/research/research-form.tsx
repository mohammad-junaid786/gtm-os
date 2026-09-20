"use client";

import { useState } from "react";
import type { ResearchItemRow } from "@/lib/research/types";
import type { CompetitorRow } from "@/lib/competitors/types";
import { createResearchItemAction, updateResearchItemAction } from "@/lib/research/actions";
import { researchTypes } from "@/lib/research/types";
import { cn } from "@/lib/utils";

export function ResearchForm({
  productId,
  item,
  competitors,
  onSuccess,
  onCancel,
}: {
  productId: string;
  item?: ResearchItemRow;
  competitors: CompetitorRow[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!item;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active competitors for the dropdown. If editing, we also include the currently selected one even if it's archived, just in case.
  // But wait, the requirement says "New/updated research can only reference an active competitor."
  // So we only show active competitors in the dropdown. If they are editing and want to keep it on an archived competitor,
  // we either allow keeping the current value, or force them to pick an active one if they change it.
  // The simplest is to include the current one if it's set, plus all active ones.
  const activeCompetitors = competitors.filter(c => c.archived_at === null || c.id === item?.competitor_id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const type = formData.get("type") as typeof researchTypes[number];
    const competitorIdStr = formData.get("competitorId") as string;
    const competitorId = competitorIdStr === "" ? null : competitorIdStr;
    
    const source_name = formData.get("source_name") as string || null;
    const source_url = formData.get("source_url") as string || null;
    const content = formData.get("content") as string || null;
    const date_researched = formData.get("date_researched") as string || null;

    try {
      if (isEditing) {
        const res = await updateResearchItemAction(productId, item.id, {
          title,
          type,
          competitorId,
          source_name,
          source_url,
          content,
          date_researched,
        });
        if (res.ok) {
          onSuccess();
        } else {
          setError(res.error.message);
        }
      } else {
        const res = await createResearchItemAction({
          productId,
          title,
          type,
          competitorId,
          source_name,
          source_url,
          content,
          date_researched,
        });
        if (res.ok) {
          onSuccess();
        } else {
          setError(res.error.message);
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(!isEditing && "rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl")}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="p-6 space-y-6 flex-1">
          {!isEditing && (
            <div>
              <h3 className="text-lg font-semibold leading-none tracking-tight">Add Research Item</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Log a new interview, article, or competitor analysis.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="title" className="text-sm font-medium leading-none">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                required
                defaultValue={item?.title}
                maxLength={255}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Q3 Industry Analyst Report"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium leading-none">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                required
                defaultValue={item?.type || "article"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {researchTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="date_researched" className="text-sm font-medium leading-none">
                Date
              </label>
              <input
                id="date_researched"
                name="date_researched"
                type="date"
                defaultValue={item?.date_researched ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="competitorId" className="text-sm font-medium leading-none">
                Related Competitor (Optional)
              </label>
              <select
                id="competitorId"
                name="competitorId"
                defaultValue={item?.competitor_id ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- None --</option>
                {activeCompetitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.archived_at && c.id === item?.competitor_id ? "(Archived)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[0.8rem] text-muted-foreground">
                Only active competitors can be selected.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="source_name" className="text-sm font-medium leading-none">
                Source Name
              </label>
              <input
                id="source_name"
                name="source_name"
                defaultValue={item?.source_name ?? ""}
                maxLength={255}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. John Doe, Gartner"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="source_url" className="text-sm font-medium leading-none">
                Source URL
              </label>
              <input
                id="source_url"
                name="source_url"
                type="url"
                defaultValue={item?.source_url ?? ""}
                placeholder="https://"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="content" className="text-sm font-medium leading-none">
                Findings / Notes
              </label>
              <textarea
                id="content"
                name="content"
                defaultValue={item?.content ?? ""}
                maxLength={10000}
                rows={6}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Key takeaways, quotes, or insights..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-3 bg-muted/20">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
