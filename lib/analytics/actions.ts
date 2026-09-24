"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import { 
  getGtmMetrics, 
  getPipelineFunnel, 
  getCampaignPerformance, 
  getLeadsOverTime,
  getLeadStatusDistribution,
  getExperimentStatusDistribution,
  getStrategicVolume,
  getAvailableAnalyticsFilters
} from "./service";
import type { 
  AnalyticsResult, 
  GtmMetrics, 
  PipelineFunnel, 
  CampaignPerformance,
  AnalyticsFilters,
  AvailableFilters
} from "./types";

export async function loadGtmMetricsAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<GtmMetrics>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    // AnalyticsServiceError doesn't define auth errors, but we can coerce PRODUCT_ID_INVALID 
    // or just return UNKNOWN. Since it's read-only, UNKNOWN is fine.
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getGtmMetrics(auth.productId, filters);
}

export async function loadPipelineFunnelAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<PipelineFunnel[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getPipelineFunnel(auth.productId, filters);
}

export async function loadCampaignPerformanceAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<CampaignPerformance[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getCampaignPerformance(auth.productId, filters);
}

export async function loadLeadsOverTimeAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<{ period: string; count: number }[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getLeadsOverTime(auth.productId, filters);
}

export async function loadLeadStatusDistributionAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<{ status: string; count: number }[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getLeadStatusDistribution(auth.productId, filters);
}

export async function loadExperimentStatusDistributionAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<{ status: string; count: number }[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getExperimentStatusDistribution(auth.productId, filters);
}

export async function loadStrategicVolumeAction(
  clientProductId: string,
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<{ totalLearnings: number; totalResearchItems: number }>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getStrategicVolume(auth.productId, filters);
}

export async function loadAvailableFiltersAction(
  clientProductId: string
): Promise<AnalyticsResult<AvailableFilters>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getAvailableAnalyticsFilters(auth.productId);
}
