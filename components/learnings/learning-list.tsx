"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LearningForm } from "./learning-form";
import type { LearningRow } from "@/lib/learnings/types";
import { archiveLearningAction } from "@/lib/learnings/actions";

export function LearningList({
  productId,
  learnings: initialLearnings,
}: {
  productId: string;
  learnings: LearningRow[];
}) {
  const [learnings, setLearnings] = useState<LearningRow[]>(initialLearnings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(learningId: string) {
    setArchivingId(learningId);
    const result = await archiveLearningAction(productId, learningId);
    setArchivingId(null);
    if (result.ok) {
      setLearnings((prev) => prev.filter((l) => l.id !== learningId));
    } else {
      alert(`Failed to archive learning: ${result.error}`);
    }
  }

  function handleCreated(newLearning: LearningRow) {
    setLearnings((prev) => [newLearning, ...prev]);
    setIsCreating(false);
  }

  function handleUpdated(updatedLearning: LearningRow) {
    setLearnings((prev) =>
      prev.map((l) => (l.id === updatedLearning.id ? updatedLearning : l))
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Learnings ({learnings.length})</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Learning
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-medium text-foreground">Create New Learning</h3>
          <LearningForm
            productId={productId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {learnings.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No learnings captured yet.</p>
          <button onClick={() => setIsCreating(true)} className="mt-4 text-sm font-medium text-primary hover:underline">
            Document your first learning
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {learnings.map((learning) => {
          if (editingId === learning.id) {
            return (
              <div key={learning.id} className="rounded-md border border-border bg-surface p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-medium text-foreground">Edit Learning</h3>
                <LearningForm
                  productId={productId}
                  learning={learning}
                  onSuccess={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            );
          }

          return (
            <div key={learning.id} className="rounded-md border border-border bg-surface p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{learning.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {learning.source_type && (
                      <span className="inline-flex items-center rounded-full bg-muted/20 px-2.5 py-0.5 text-xs font-medium text-foreground">
                        Source: {learning.source_type}
                      </span>
                    )}
                    {learning.confidence_level && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        Confidence: {learning.confidence_level}
                      </span>
                    )}
                    {learning.impact_level && (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                        Impact: {learning.impact_level}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingId(learning.id)} className="text-sm text-muted hover:text-foreground">
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(learning.id)}
                    disabled={archivingId === learning.id}
                    className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    {archivingId === learning.id ? "Archiving..." : "Archive"}
                  </button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-muted-foreground mt-4 whitespace-pre-wrap">
                {learning.insight}
              </div>

              {learning.action_items && learning.action_items.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Next Steps</h4>
                  <ul className="list-inside list-disc text-sm text-muted">
                    {learning.action_items.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
