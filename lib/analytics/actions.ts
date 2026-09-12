"use server";

import { authorizeProductAction } from "@/lib/routing/authorize-action";
import { getGtmMetrics, getPipelineFunnel, getCampaignPerformance } from "./service";
import type { AnalyticsResult, GtmMetrics, PipelineFunnel, CampaignPerformance } from "./types";

export async function loadGtmMetricsAction(
  clientProductId: string
): Promise<AnalyticsResult<GtmMetrics>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    // AnalyticsServiceError doesn't define auth errors, but we can coerce PRODUCT_ID_INVALID 
    // or just return UNKNOWN. Since it's read-only, UNKNOWN is fine.
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getGtmMetrics(auth.productId);
}

export async function loadPipelineFunnelAction(
  clientProductId: string
): Promise<AnalyticsResult<PipelineFunnel[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getPipelineFunnel(auth.productId);
}

export async function loadCampaignPerformanceAction(
  clientProductId: string
): Promise<AnalyticsResult<CampaignPerformance[]>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  return getCampaignPerformance(auth.productId);
}
