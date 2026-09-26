"use client";

import { useState } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { CampaignForm } from "./campaign-form";
import { ContextualLearningDialog } from "@/components/learnings/contextual-learning-dialog";
import { getCampaignMetrics } from "@/lib/campaigns/types";
import type { CampaignRow } from "@/lib/campaigns/types";
import { archiveCampaignAction } from "@/lib/campaigns/actions";
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
  if (s === "active" || s === "running") return "success";
  if (s === "paused" || s === "draft") return "neutral";
  if (s === "completed") return "info";
  return "default";
}

export function CampaignList({
  productId,
  campaigns: initialCampaigns,
}: {
  productId: string;
  campaigns: CampaignRow[];
}) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [learningCampaign, setLearningCampaign] = useState<CampaignRow | null>(null);

  async function handleArchive(campaignId: string) {
    setArchivingId(campaignId);
    const result = await archiveCampaignAction(productId, campaignId);
    setArchivingId(null);
    if (result.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } else {
      alert(`Failed to archive campaign: ${result.error.message}`);
    }
  }

  function handleCreated(newCampaign: CampaignRow) {
    setCampaigns((prev) => [...prev, newCampaign]);
    setIsCreating(false);
  }

  function handleUpdated(updatedCampaign: CampaignRow) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c))
    );
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        start={
          <h2 className="text-lg font-medium text-foreground">
            Campaigns <span className="text-muted-foreground text-sm font-normal ml-1">({campaigns.length})</span>
          </h2>
        }
        end={
          !isCreating && (
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Campaign
            </Button>
          )
        }
      />

      {isCreating && (
        <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-sm font-medium text-foreground">Create New Campaign</h3>
          <CampaignForm
            productId={productId}
            onSuccess={handleCreated}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {campaigns.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center bg-surface/50">
          <p className="text-sm font-medium text-foreground">No campaigns added yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first outbound or inbound campaign to start tracking efficiency.
          </p>
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Campaign
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Channel / Objective</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">CPL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              if (editingId === campaign.id) {
                return (
                  <TableRow key={campaign.id}>
                    <TableCell colSpan={8} className="p-0">
                      <div className="border-b border-border bg-surface p-6">
                        <h3 className="mb-6 text-sm font-medium text-foreground">Edit Campaign</h3>
                        <CampaignForm
                          productId={productId}
                          campaign={campaign}
                          onSuccess={handleUpdated}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              const metrics = getCampaignMetrics(campaign);

              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{campaign.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{campaign.channel || "—"}</div>
                    <div className="text-xs text-muted-foreground">{campaign.objective || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    ${(campaign.spend / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    ${(campaign.revenue / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {campaign.leads_generated}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-foreground">
                    ${(metrics.cplCents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setLearningCampaign(campaign)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Log Learning"
                      >
                        <Lightbulb className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(campaign.id)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchive(campaign.id)}
                        disabled={archivingId === campaign.id}
                        className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                      >
                        {archivingId === campaign.id ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {learningCampaign && (
        <ContextualLearningDialog
          open={!!learningCampaign}
          onOpenChange={(open) => {
            if (!open) setLearningCampaign(null);
          }}
          productId={productId}
          sourceType="campaign"
          sourceId={learningCampaign.id}
          sourceDisplayName={learningCampaign.name}
          sourceContext={learningCampaign.outcome ?? undefined}
          onSuccess={() => setLearningCampaign(null)}
        />
      )}
    </div>
  );
}
