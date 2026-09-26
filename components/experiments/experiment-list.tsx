"use client";

import { useState } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { ExperimentForm } from "./experiment-form";
import { ContextualLearningDialog } from "@/components/learnings/contextual-learning-dialog";
import type { ExperimentRow } from "@/lib/experiments/types";
import { archiveExperimentAction } from "@/lib/experiments/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getStatusBadgeVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "running" || s === "active") return "success";
  if (s === "planned" || s === "draft") return "neutral";
  if (s === "completed") return "info";
  if (s === "failed" || s === "stopped") return "destructive";
  return "default";
}

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
  const [learningExperiment, setLearningExperiment] = useState<ExperimentRow | null>(null);

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
    <div className="space-y-6">
      <PageToolbar
        start={
          <h2 className="text-lg font-medium text-foreground">
            Experiments <span className="text-muted-foreground text-sm font-normal ml-1">({experiments.length})</span>
          </h2>
        }
        end={
          !isCreating && (
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Experiment
            </Button>
          )
        }
      />

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

      {experiments.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center bg-surface/50">
          <p className="text-sm font-medium text-foreground">No experiments added yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Design, run, and track go-to-market experiments and hypotheses.
          </p>
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Experiment
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Experiment Name</TableHead>
              <TableHead>Hypothesis</TableHead>
              <TableHead>Goal / Metric</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.map((experiment) => {
              if (editingId === experiment.id) {
                return (
                  <TableRow key={experiment.id}>
                    <TableCell colSpan={7} className="p-0">
                      <div className="border-b border-border bg-surface p-6">
                        <h3 className="mb-6 text-sm font-medium text-foreground">Edit Experiment</h3>
                        <ExperimentForm
                          productId={productId}
                          experiment={experiment}
                          onSuccess={handleUpdated}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={experiment.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{experiment.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground" title={experiment.hypothesis || ""}>
                      {experiment.hypothesis || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{experiment.goal || "—"}</div>
                    <div className="text-xs text-muted-foreground">{experiment.primary_metric || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{experiment.channel || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(experiment.status)}>{experiment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {experiment.budget != null ? `$${(experiment.budget / 100).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setLearningExperiment(experiment)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Log Learning"
                      >
                        <Lightbulb className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(experiment.id)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchive(experiment.id)}
                        disabled={archivingId === experiment.id}
                        className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                      >
                        {archivingId === experiment.id ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {learningExperiment && (
        <ContextualLearningDialog
          open={!!learningExperiment}
          onOpenChange={(open) => {
            if (!open) setLearningExperiment(null);
          }}
          productId={productId}
          sourceType="experiment"
          sourceId={learningExperiment.id}
          sourceDisplayName={learningExperiment.name}
          sourceContext={learningExperiment.outcome ?? undefined}
          onSuccess={() => setLearningExperiment(null)}
        />
      )}
    </div>
  );
}
