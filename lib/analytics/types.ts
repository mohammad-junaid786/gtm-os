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

export interface LeadStatusDistribution {
  status: string;
  count: number;
}

export interface LeadsOverTime {
  period: string; // e.g., "YYYY-MM" or "YYYY-MM-DD"
  count: number;
}

export interface ExperimentStatusDistribution {
  status: string;
  count: number;
}

export interface StrategicVolume {
  totalLearnings: number;
  totalResearchItems: number;
}

export type AnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AnalyticsServiceError };

export type AnalyticsServiceError =
  | "PRODUCT_ID_INVALID"
  | "UNKNOWN";

export interface AnalyticsFilters {
  startDate?: string; // ISO format YYYY-MM-DD
  endDate?: string;   // ISO format YYYY-MM-DD
  leadStatus?: string;
  campaignId?: string;
  experimentStatus?: string;
}

export interface AvailableFilters {
  leadStatuses: string[];
  experimentStatuses: string[];
  campaigns: { id: string; name: string }[];
}
