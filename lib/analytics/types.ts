export interface GtmMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  totalCampaignSpendCents: number;
  totalCampaignRevenueCents: number;
  overallCacCents: number | null; // Spend per conversion
  overallCplCents: number | null; // Spend per lead generated
  overallRoas: number | null; // Revenue / Spend
}

export interface PipelineFunnel {
  status: string;
  count: number;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  spend: number;
  revenue: number;
  leadsGenerated: number;
  conversions: number;
  roas: number | null;
  cpl: number | null;
  cac: number | null;
}

export type AnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AnalyticsServiceError };

export type AnalyticsServiceError =
  | "PRODUCT_ID_INVALID"
  | "UNKNOWN";
