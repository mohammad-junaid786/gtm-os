"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CampaignForm } from "./campaign-form";
import { getCampaignMetrics } from "@/lib/campaigns/types";
import type { CampaignRow } from "@/lib/campaigns/types";
import { archiveCampaignAction } from "@/lib/campaigns/actions";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Campaigns ({campaigns.length})</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Campaign
          </button>
        )}
      </div>

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

      {campaigns.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">No campaigns added yet.</p>
          <button onClick={() => setIsCreating(true)} className="mt-4 text-sm font-medium text-primary hover:underline">
            Create your first campaign
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {campaigns.map((campaign) => {
          if (editingId === campaign.id) {
            return (
              <div key={campaign.id} className="rounded-md border border-border bg-surface p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-medium text-foreground">Edit Campaign</h3>
                <CampaignForm
                  productId={productId}
                  campaign={campaign}
                  onSuccess={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            );
          }

          const metrics = getCampaignMetrics(campaign);

          return (
            <div key={campaign.id} className="rounded-md border border-border bg-surface p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{campaign.name}</h3>
                  <p className="text-sm text-muted">
                    {campaign.status} • {campaign.channel || "No channel"} • {campaign.objective || "No objective"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingId(campaign.id)} className="text-sm text-muted hover:text-foreground">
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(campaign.id)}
                    disabled={archivingId === campaign.id}
                    className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    {archivingId === campaign.id ? "Archiving..." : "Archive"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted uppercase">Spend</div>
                  <div className="text-sm font-medium">${(campaign.spend / 100).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Revenue</div>
                  <div className="text-sm font-medium">${(campaign.revenue / 100).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">Leads</div>
                  <div className="text-sm font-medium">{campaign.leads_generated}</div>
                </div>
                <div>
                  <div className="text-xs text-muted uppercase">CPL</div>
                  <div className="text-sm font-medium">${(metrics.cplCents / 100).toFixed(2)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
