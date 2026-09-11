/**
 * Domain types for Campaigns operations.
 * 
 * All financial metrics (budget, revenue, spend) are stored as integer cents.
 */

export const CAMPAIGN_STATUSES = ["Planned", "Active", "Paused", "Completed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface CampaignRow {
  id: string;
  product_id: string;
  name: string;
  objective: string | null;
  audience: string | null;
  channel: string | null;
  start_date: Date | null;
  end_date: Date | null;
  budget: number | null; // cents
  status: string;

  impressions: number;
  clicks: number;
  leads_generated: number;
  qualified_leads: number;
  conversions: number;
  revenue: number; // cents
  spend: number; // cents

  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCampaignInput {
  name: string;
  objective?: string;
  audience?: string;
  channel?: string;
  start_date?: Date;
  end_date?: Date;
  budget?: number; // cents
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  name?: string;
  objective?: string | null;
  audience?: string | null;
  channel?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  budget?: number | null; // cents
  status?: CampaignStatus;

  impressions?: number;
  clicks?: number;
  leads_generated?: number;
  qualified_leads?: number;
  conversions?: number;
  revenue?: number; // cents
  spend?: number; // cents
}

export type CampaignResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CampaignServiceError };

export type CampaignServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "CAMPAIGN_ID_INVALID"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "STATUS_INVALID"; message: string }
  | { code: "CAMPAIGN_NOT_FOUND"; message: string }
  | { code: "CAMPAIGN_ALREADY_ARCHIVED"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };

// Helper to calculate derived metrics safely without division by zero
export function getCampaignMetrics(c: CampaignRow) {
  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
  const conversionRate = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
  // CPL (Cost Per Lead) based on spend and leads_generated. Spend is in cents, so we return cents per lead, or dollars per lead.
  // We will compute dollars per lead for display:
  const cplCents = c.leads_generated > 0 ? c.spend / c.leads_generated : 0;
  const cacCents = c.conversions > 0 ? c.spend / c.conversions : 0;
  const roas = c.spend > 0 ? c.revenue / c.spend : 0;

  return {
    ctr,
    conversionRate,
    cplCents,
    cacCents,
    roas,
  };
}
