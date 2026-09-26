"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Edit2, Archive } from "lucide-react";
import { LearningForm } from "./learning-form";
import type { LearningRow } from "@/lib/learnings/types";
import { archiveLearningAction } from "@/lib/learnings/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ExperimentForm } from "@/components/experiments/experiment-form";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { Badge } from "@/components/ui/badge";

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
  const [promotingAction, setPromotingAction] = useState<{ type: "experiment" | "campaign"; text: string } | null>(null);

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
    <div className="space-y-6">
      <PageToolbar
        start={<h2 className="text-lg font-medium text-foreground">Learnings ({learnings.length})</h2>}
        end={!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Learning
          </button>
        )}
      />

      {isCreating && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-semibold text-foreground">Create New Learning</h3>
          <LearningForm
            productId={productId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {learnings.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-24 px-6 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">No learnings captured yet</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Document critical insights to inform future campaigns and experiments.
            </p>
            <button onClick={() => setIsCreating(true)} className="mt-4 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Document first learning
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {learnings.map((learning) => {
          if (editingId === learning.id) {
            return (
              <div key={learning.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm col-span-1 md:col-span-2 xl:col-span-3">
                <h3 className="mb-6 text-sm font-semibold text-foreground">Edit Learning</h3>
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
            <div key={learning.id} className="flex flex-col h-full rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="flex flex-col bg-primary p-5 gap-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 pr-4">
                    <h3 className="text-base font-semibold leading-tight tracking-tight text-white">
                      {learning.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-0.5">
                      {learning.source_type && (
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 border-transparent text-[10px] uppercase tracking-widest font-semibold px-2 py-0">
                          {learning.source_type}
                        </Badge>
                      )}
                      {learning.confidence_level && (
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 border-transparent text-[10px] uppercase tracking-widest px-2 py-0">
                          {learning.confidence_level} conf.
                        </Badge>
                      )}
                      {learning.impact_level && (
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 border-transparent text-[10px] uppercase tracking-widest px-2 py-0">
                          {learning.impact_level} impact
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(learning.id)}
                      title="Edit"
                      className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(learning.id)}
                      disabled={archivingId === learning.id}
                      title="Archive"
                      className="h-8 w-8 p-0 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      {archivingId === learning.id ? "..." : <Archive className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-6 space-y-6">
                <div className="text-sm whitespace-pre-wrap flex-1 text-foreground/90 font-serif leading-relaxed max-w-full">
                  {learning.insight}
                </div>

                {learning.action_items && learning.action_items.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2.5">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {learning.action_items.map((action, i) => (
                        <li key={i} className="group flex items-start justify-between gap-3 text-sm rounded-md border border-border border-l-2 border-l-primary/50 bg-surface-subtle pl-3 pr-2 py-2.5">
                          <span className="flex-1 text-foreground leading-relaxed">{action}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setPromotingAction({ type: "experiment", text: action })}>
                                Create Experiment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPromotingAction({ type: "campaign", text: action })}>
                                Create Campaign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {promotingAction && (
        <Dialog 
          open={!!promotingAction} 
          onOpenChange={(open) => {
            if (!open) setPromotingAction(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create {promotingAction.type === "experiment" ? "Experiment" : "Campaign"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {promotingAction.type === "experiment" ? (
                <ExperimentForm
                  key={promotingAction.text}
                  productId={productId}
                  prefilledName={promotingAction.text}
                  onSuccess={() => setPromotingAction(null)}
                  onCancel={() => setPromotingAction(null)}
                />
              ) : (
                <CampaignForm
                  key={promotingAction.text}
                  productId={productId}
                  prefilledName={promotingAction.text}
                  onSuccess={() => setPromotingAction(null)}
                  onCancel={() => setPromotingAction(null)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
