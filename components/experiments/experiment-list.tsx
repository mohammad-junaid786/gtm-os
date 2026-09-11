"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExperimentForm } from "./experiment-form";
import type { ExperimentRow } from "@/lib/experiments/types";
import { archiveExperimentAction } from "@/lib/experiments/actions";

export function ExperimentList({
  productId,
  experiments: initialExperiments,
}: {
  productId: string;
  experiments: ExperimentRow[];
}) {
  const [experiments, setExperiments] = useState<ExperimentRow[]>(initialExperiments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function handleArchive(experimentId: string) {
    setArchivingId(experimentId);
    const result = await archiveExperimentAction(productId, experimentId);
    setArchivingId(null);
    if (result.ok) {
      setExperiments((prev) => prev.filter((e) => e.id !== experimentId));
    } else {
      alert(`Failed to archive experiment: ${result.error.message}`);
    }
  }

  function handleCreated(newExperiment: ExperimentRow) {
    setExperiments((prev) => [...prev, newExperiment]);
    setIsCreating(false);
  }

  function handleUpdated(updatedExperiment: ExperimentRow) {
    setExperiments((prev) =>
      prev.map((e) => (e.id === updatedExperiment.id ? updatedExperiment : e))
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Experiments ({experiments.length})</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Experiment
          </button>
        )}
      </div>

      {isCreating && (
        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-medium text-foreground">Create New Experiment</h3>
          <ExperimentForm
            productId={productId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {experiments.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No experiments added yet.</p>
          <button onClick={() => setIsCreating(true)} className="mt-4 text-sm font-medium text-primary hover:underline">
            Create your first experiment
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {experiments.map((experiment) => {
          if (editingId === experiment.id) {
            return (
              <div key={experiment.id} className="rounded-md border border-border bg-surface p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-medium text-foreground">Edit Experiment</h3>
                <ExperimentForm
                  productId={productId}
                  experiment={experiment}
                  onSuccess={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            );
          }

          return (
            <div key={experiment.id} className="rounded-md border border-border bg-surface p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{experiment.name}</h3>
                  <p className="text-sm text-muted">
                    {experiment.status} • {experiment.goal || "No goal"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingId(experiment.id)} className="text-sm text-muted hover:text-foreground">
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(experiment.id)}
                    disabled={archivingId === experiment.id}
                    className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    {archivingId === experiment.id ? "Archiving..." : "Archive"}
                  </button>
                </div>
              </div>

              {experiment.hypothesis && (
                <div className="mb-4 text-sm text-foreground">
                  <span className="font-medium">Hypothesis:</span> {experiment.hypothesis}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted uppercase">Channel</div>
                  <div className="text-sm font-medium">{experiment.channel || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Primary Metric</div>
                  <div className="text-sm font-medium">{experiment.primary_metric || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Budget</div>
                  <div className="text-sm font-medium">{experiment.budget != null ? `$${(experiment.budget / 100).toFixed(2)}` : "—"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
