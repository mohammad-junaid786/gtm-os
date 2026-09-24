import "server-only";
import { eq, and, or, gte, lte, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns, leads, experiments, learnings, researchItems } from "@/db/schema";
import { z } from "zod";
import type {
  AnalyticsResult,
  GtmMetrics,
  PipelineFunnel,
  CampaignPerformance,
  LeadStatusDistribution,
  LeadsOverTime,
  ExperimentStatusDistribution,
  StrategicVolume,
  AnalyticsFilters,
  AvailableFilters
} from "./types";

const uuidSchema = z.string().uuid();

export async function getGtmMetrics(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<GtmMetrics>> {
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
          isNull(campaigns.archived_at),
          filters?.campaignId ? eq(campaigns.id, filters.campaignId) : undefined,
          filters?.startDate ? or(isNull(campaigns.end_date), gte(campaigns.end_date, new Date(filters.startDate))) : undefined,
          filters?.endDate ? or(isNull(campaigns.start_date), lte(campaigns.start_date, new Date(filters.endDate + 'T23:59:59.999Z'))) : undefined
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
          isNull(leads.archived_at),
          filters?.leadStatus ? eq(leads.status, filters.leadStatus) : undefined,
          filters?.startDate ? gte(leads.created_at, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(leads.created_at, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
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

export async function getPipelineFunnel(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<PipelineFunnel[]>> {
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
          isNull(leads.archived_at),
          filters?.leadStatus ? eq(leads.status, filters.leadStatus) : undefined,
          filters?.startDate ? gte(leads.created_at, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(leads.created_at, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
        )
      )
      .groupBy(leads.status);

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getCampaignPerformance(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<CampaignPerformance[]>> {
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
          isNull(campaigns.archived_at),
          filters?.campaignId ? eq(campaigns.id, filters.campaignId) : undefined,
          filters?.startDate ? or(isNull(campaigns.end_date), gte(campaigns.end_date, new Date(filters.startDate))) : undefined,
          filters?.endDate ? or(isNull(campaigns.start_date), lte(campaigns.start_date, new Date(filters.endDate + 'T23:59:59.999Z'))) : undefined
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

export async function getLeadStatusDistribution(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<LeadStatusDistribution[]>> {
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
          isNull(leads.archived_at),
          filters?.leadStatus ? eq(leads.status, filters.leadStatus) : undefined,
          filters?.startDate ? gte(leads.created_at, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(leads.created_at, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
        )
      )
      .groupBy(leads.status)
      .orderBy(leads.status);

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getLeadsOverTime(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<LeadsOverTime[]>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        period: sql<string>`to_char(${leads.created_at}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(leads)
      .where(
        and(
          eq(leads.product_id, parsedProductId.data),
          isNull(leads.archived_at),
          filters?.leadStatus ? eq(leads.status, filters.leadStatus) : undefined,
          filters?.startDate ? gte(leads.created_at, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(leads.created_at, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
        )
      )
      .groupBy(sql`to_char(${leads.created_at}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${leads.created_at}, 'YYYY-MM')`);

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getExperimentStatusDistribution(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<ExperimentStatusDistribution[]>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        status: experiments.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(experiments)
      .where(
        and(
          eq(experiments.product_id, parsedProductId.data),
          isNull(experiments.archived_at),
          filters?.experimentStatus ? eq(experiments.status, filters.experimentStatus) : undefined,
          filters?.startDate ? or(isNull(experiments.end_date), gte(experiments.end_date, new Date(filters.startDate))) : undefined,
          filters?.endDate ? or(isNull(experiments.start_date), lte(experiments.start_date, new Date(filters.endDate + 'T23:59:59.999Z'))) : undefined
        )
      )
      .groupBy(experiments.status)
      .orderBy(experiments.status);

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getStrategicVolume(productId: string, filters?: AnalyticsFilters): Promise<AnalyticsResult<StrategicVolume>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();

    const [learningsAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(learnings)
      .where(
        and(
          eq(learnings.product_id, parsedProductId.data),
          isNull(learnings.archived_at),
          filters?.startDate ? gte(learnings.created_at, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(learnings.created_at, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
        )
      );

    const [researchAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(researchItems)
      .where(
        and(
          eq(researchItems.product_id, parsedProductId.data),
          isNull(researchItems.archived_at),
          filters?.startDate ? gte(sql`COALESCE(${researchItems.date_researched}, ${researchItems.created_at})`, new Date(filters.startDate)) : undefined,
          filters?.endDate ? lte(sql`COALESCE(${researchItems.date_researched}, ${researchItems.created_at})`, new Date(filters.endDate + 'T23:59:59.999Z')) : undefined
        )
      );

    return {
      ok: true,
      data: {
        totalLearnings: learningsAgg?.count ?? 0,
        totalResearchItems: researchAgg?.count ?? 0,
      },
    };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
export async function getAvailableAnalyticsFilters(productId: string): Promise<AnalyticsResult<AvailableFilters>> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();

    // 1. Get distinct lead statuses
    const leadStatusRows = await db
      .selectDistinct({ status: leads.status })
      .from(leads)
      .where(
        and(
          eq(leads.product_id, parsedProductId.data),
          isNull(leads.archived_at)
        )
      )
      .orderBy(leads.status);
      
    // 2. Get distinct experiment statuses
    const experimentStatusRows = await db
      .selectDistinct({ status: experiments.status })
      .from(experiments)
      .where(
        and(
          eq(experiments.product_id, parsedProductId.data),
          isNull(experiments.archived_at)
        )
      )
      .orderBy(experiments.status);

    // 3. Get all active campaigns for the product
    const campaignRows = await db
      .select({ id: campaigns.id, name: campaigns.name })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.product_id, parsedProductId.data),
          isNull(campaigns.archived_at)
        )
      )
      .orderBy(campaigns.name);

    return {
      ok: true,
      data: {
        leadStatuses: leadStatusRows.map((r) => r.status),
        experimentStatuses: experimentStatusRows.map((r) => r.status),
        campaigns: campaignRows,
      },
    };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
