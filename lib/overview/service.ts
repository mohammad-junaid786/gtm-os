import "server-only";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, campaigns, experiments, personas, icps } from "@/db/schema";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export type OverviewMetrics = {
  totalLeads: number;
  totalCampaigns: number;
  totalExperiments: number;
  totalPersonas: number;
};

export type OverviewMetricsResult = 
  | { ok: true; data: OverviewMetrics }
  | { ok: false; error: string };

export async function getOverviewMetrics(productId: string): Promise<OverviewMetricsResult> {
  const parsedProductId = uuidSchema.safeParse(productId);
  if (!parsedProductId.success) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();

    const [leadsAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(leads)
      .where(and(eq(leads.product_id, parsedProductId.data), isNull(leads.archived_at)));

    const [campaignsAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(campaigns)
      .where(and(eq(campaigns.product_id, parsedProductId.data), isNull(campaigns.archived_at)));

    const [experimentsAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(experiments)
      .where(and(eq(experiments.product_id, parsedProductId.data), isNull(experiments.archived_at)));

    // Personas belong to an ICP, which belongs to a product. We count personas for the product's active ICPs.
    const [personasAgg] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(personas)
      .innerJoin(icps, eq(personas.icp_id, icps.id))
      .where(
        and(
          eq(icps.product_id, parsedProductId.data),
          isNull(icps.archived_at),
          isNull(personas.archived_at)
        )
      );

    return {
      ok: true,
      data: {
        totalLeads: leadsAgg?.count ?? 0,
        totalCampaigns: campaignsAgg?.count ?? 0,
        totalExperiments: experimentsAgg?.count ?? 0,
        totalPersonas: personasAgg?.count ?? 0,
      },
    };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
