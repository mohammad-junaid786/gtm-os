import "server-only";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns, leads } from "@/db/schema";
import { z } from "zod";
import type {
  AnalyticsResult,
  GtmMetrics,
  PipelineFunnel,
  CampaignPerformance,
} from "./types";

const uuidSchema = z.string().uuid();

export async function getGtmMetrics(productId: string): Promise<AnalyticsResult<GtmMetrics>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    
    // Aggregate campaign metrics
    const [campaignAgg] = await db
      .select({
        totalSpend: sql<number>`COALESCE(SUM(${campaigns.spend}), 0)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(${campaigns.revenue}), 0)::int`,
        totalLeadsGenerated: sql<number>`COALESCE(SUM(${campaigns.leads_generated}), 0)::int`,
        totalConversions: sql<number>`COALESCE(SUM(${campaigns.conversions}), 0)::int`,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.product_id, parsedProductId.data),
          isNull(campaigns.archived_at)
        )
      );

    // Count leads
    const [leadsAgg] = await db
      .select({
        totalLeads: sql<number>`COUNT(*)::int`,
        qualifiedLeads: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} IN ('Qualified', 'Opportunity', 'Won'))::int`,
      })
      .from(leads)
      .where(
        and(
          eq(leads.product_id, parsedProductId.data),
          isNull(leads.archived_at)
        )
      );

    const spend = campaignAgg?.totalSpend ?? 0;
    const revenue = campaignAgg?.totalRevenue ?? 0;
    const leadsGenerated = campaignAgg?.totalLeadsGenerated ?? 0;
    const conversions = campaignAgg?.totalConversions ?? 0;

    return {
      ok: true,
      data: {
        totalLeads: leadsAgg?.totalLeads ?? 0,
        qualifiedLeads: leadsAgg?.qualifiedLeads ?? 0,
        totalCampaignSpendCents: spend,
        totalCampaignRevenueCents: revenue,
        overallCplCents: leadsGenerated > 0 ? Math.round(spend / leadsGenerated) : null,
        overallCacCents: conversions > 0 ? Math.round(spend / conversions) : null,
        overallRoas: spend > 0 ? revenue / spend : null,
      },
    };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getPipelineFunnel(productId: string): Promise<AnalyticsResult<PipelineFunnel[]>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        status: leads.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(leads)
      .where(
        and(
          eq(leads.product_id, parsedProductId.data),
          isNull(leads.archived_at)
        )
      )
      .groupBy(leads.status);

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getCampaignPerformance(productId: string): Promise<AnalyticsResult<CampaignPerformance[]>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.product_id, parsedProductId.data),
          isNull(campaigns.archived_at)
        )
      )
      .orderBy(campaigns.name);

    const data: CampaignPerformance[] = rows.map((c) => ({
      campaignId: c.id,
      name: c.name,
      spend: c.spend,
      revenue: c.revenue,
      leadsGenerated: c.leads_generated,
      conversions: c.conversions,
      roas: c.spend > 0 ? c.revenue / c.spend : null,
      cpl: c.leads_generated > 0 ? Math.round(c.spend / c.leads_generated) : null,
      cac: c.conversions > 0 ? Math.round(c.spend / c.conversions) : null,
    }));

    return { ok: true, data };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
