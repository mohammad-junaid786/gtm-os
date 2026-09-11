"use client";

import { useState, useTransition } from "react";
import { createCampaignAction, updateCampaignAction } from "@/lib/campaigns/actions";
import { CAMPAIGN_STATUSES } from "@/lib/campaigns/types";
import type { CampaignRow, CampaignStatus } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type="number"
      value={value === "" ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    />
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
      )}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function CampaignForm({
  productId,
  campaign,
  onSuccess,
  onCancel,
}: {
  productId: string;
  campaign?: CampaignRow;
  onSuccess: (campaign: CampaignRow) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState(campaign?.name ?? "");
  const [objective, setObjective] = useState(campaign?.objective ?? "");
  const [audience, setAudience] = useState(campaign?.audience ?? "");
  const [channel, setChannel] = useState(campaign?.channel ?? "");
  const [budgetDollars, setBudgetDollars] = useState<number | "">(
    campaign?.budget != null ? campaign.budget / 100 : ""
  );
  const [status, setStatus] = useState<CampaignStatus>((campaign?.status as CampaignStatus) ?? "Planned");

  // Metrics (only editable on existing campaigns for simplicity in this form, or initialized to 0)
  const [impressions, setImpressions] = useState<number | "">(campaign?.impressions ?? "");
  const [clicks, setClicks] = useState<number | "">(campaign?.clicks ?? "");
  const [leadsGenerated, setLeadsGenerated] = useState<number | "">(campaign?.leads_generated ?? "");
  const [conversions, setConversions] = useState<number | "">(campaign?.conversions ?? "");
  const [spendDollars, setSpendDollars] = useState<number | "">(
    campaign?.spend != null ? campaign.spend / 100 : ""
  );
  const [revenueDollars, setRevenueDollars] = useState<number | "">(
    campaign?.revenue != null ? campaign.revenue / 100 : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Campaign name is required.");
      return;
    }

    startTransition(async () => {
      const budget = budgetDollars === "" ? undefined : Math.round(budgetDollars * 100);

      if (campaign) {
        const result = await updateCampaignAction(productId, campaign.id, {
          name: trimmedName,
          objective: objective.trim() || undefined,
          audience: audience.trim() || undefined,
          channel: channel.trim() || undefined,
          budget,
          status,
          impressions: impressions === "" ? 0 : impressions,
          clicks: clicks === "" ? 0 : clicks,
          leads_generated: leadsGenerated === "" ? 0 : leadsGenerated,
          conversions: conversions === "" ? 0 : conversions,
          spend: spendDollars === "" ? 0 : Math.round(spendDollars * 100),
          revenue: revenueDollars === "" ? 0 : Math.round(revenueDollars * 100),
        });
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      } else {
        const result = await createCampaignAction(productId, {
          name: trimmedName,
          objective: objective.trim() || undefined,
          audience: audience.trim() || undefined,
          channel: channel.trim() || undefined,
          budget,
          status,
        });
        if (result.ok) onSuccess(result.data);
        else setErrorMsg(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Campaign Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Campaign Name</Label>
            <TextInput id="name" value={name} onChange={setName} disabled={isPending} placeholder="Q4 Outreach" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="objective">Objective</Label>
            <TextInput id="objective" value={objective} onChange={setObjective} disabled={isPending} placeholder="Generate leads" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience">Audience</Label>
            <TextInput id="audience" value={audience} onChange={setAudience} disabled={isPending} placeholder="Enterprise CTOs" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="channel">Channel</Label>
            <TextInput id="channel" value={channel} onChange={setChannel} disabled={isPending} placeholder="LinkedIn Ads" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget ($)</Label>
            <NumberInput id="budget" value={budgetDollars} onChange={setBudgetDollars} disabled={isPending} placeholder="5000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" value={status} onChange={(v) => setStatus(v as CampaignStatus)} options={CAMPAIGN_STATUSES} disabled={isPending} />
          </div>
        </div>
      </div>

      {campaign && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground">Metrics</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="impressions">Impressions</Label>
              <NumberInput id="impressions" value={impressions} onChange={setImpressions} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clicks">Clicks</Label>
              <NumberInput id="clicks" value={clicks} onChange={setClicks} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leads">Leads Generated</Label>
              <NumberInput id="leads" value={leadsGenerated} onChange={setLeadsGenerated} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conversions">Conversions</Label>
              <NumberInput id="conversions" value={conversions} onChange={setConversions} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spend">Spend ($)</Label>
              <NumberInput id="spend" value={spendDollars} onChange={setSpendDollars} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revenue">Revenue ($)</Label>
              <NumberInput id="revenue" value={revenueDollars} onChange={setRevenueDollars} disabled={isPending} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 text-sm text-foreground hover:bg-surface rounded-sm">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
          {isPending ? "Saving..." : campaign ? "Save Changes" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}
