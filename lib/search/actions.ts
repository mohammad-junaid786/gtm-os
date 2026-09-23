"use server";

import { getDb } from "@/db";
import { 
  icps, personas, competitors, researchItems, 
  leads, campaigns, experiments, learnings, positioning
} from "@/db/schema";
import { authorizeProductAction } from "@/lib/routing/authorize-action";
import { ilike, or, eq, isNull, and } from "drizzle-orm";

export type SearchResultItem = {
  id: string;
  type: "icp" | "persona" | "positioning" | "competitor" | "research" | "lead" | "campaign" | "experiment" | "learning";
  title: string;
  subtitle?: string;
  href: string;
};

export type SearchResults = {
  icps: SearchResultItem[];
  personas: SearchResultItem[];
  positioning: SearchResultItem[];
  competitors: SearchResultItem[];
  research: SearchResultItem[];
  leads: SearchResultItem[];
  campaigns: SearchResultItem[];
  experiments: SearchResultItem[];
  learnings: SearchResultItem[];
};

export async function searchProductEntitiesAction(
  workspaceSlug: string,
  productSlug: string,
  productId: string, 
  query: string
): Promise<{ ok: boolean; data?: SearchResults; error?: string }> {
  const auth = await authorizeProductAction(productId);
  if (!auth.ok) {
    return { ok: false, error: "Unauthorized" };
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return { ok: false, error: "Query too short" };
  }
  if (trimmedQuery.length > 100) {
    return { ok: false, error: "Query too long" };
  }

  const searchPattern = `%${trimmedQuery}%`;
  const db = getDb();

  const results: SearchResults = {
    icps: [],
    personas: [],
    positioning: [],
    competitors: [],
    research: [],
    leads: [],
    campaigns: [],
    experiments: [],
    learnings: [],
  };

  const basePath = `/w/${workspaceSlug}/${productSlug}`;
  const MAX_RESULTS = 5;

  try {
    // 1. ICPs
    const icpRows = await db.query.icps.findMany({
      where: and(
        eq(icps.product_id, productId),
        isNull(icps.archived_at),
        or(
          ilike(icps.name, searchPattern),
          ilike(icps.industry, searchPattern)
        )
      ),
      limit: MAX_RESULTS
    });
    results.icps = icpRows.map((row: any) => ({
      id: row.id,
      type: "icp",
      title: row.name,
      subtitle: row.industry || "ICP",
      href: `${basePath}/strategy/icp`
    }));

    // 2. Personas
    const personaRows = await db
      .select({
        id: personas.id,
        name: personas.name,
        role: personas.role
      })
      .from(personas)
      .innerJoin(icps, eq(personas.icp_id, icps.id))
      .where(
        and(
          eq(icps.product_id, productId),
          isNull(personas.archived_at),
          or(
            ilike(personas.name, searchPattern),
            ilike(personas.role, searchPattern)
          )
        )
      )
      .limit(MAX_RESULTS);

    results.personas = personaRows.map((row: any) => ({
      id: row.id,
      type: "persona",
      title: row.name,
      subtitle: row.role,
      href: `${basePath}/strategy/personas`
    }));

    // 3. Positioning
    const posRows = await db.query.positioning.findMany({
      where: and(
        eq(positioning.product_id, productId),
        isNull(positioning.archived_at),
        ilike(positioning.target_customer, searchPattern)
      ),
      limit: MAX_RESULTS
    });
    results.positioning = posRows.map((row: any) => ({
      id: row.id,
      type: "positioning",
      title: row.target_customer || "Positioning Target",
      subtitle: "Positioning",
      href: `${basePath}/strategy/positioning`
    }));

    // 4. Competitors
    const competitorRows = await db.query.competitors.findMany({
      where: and(
        eq(competitors.product_id, productId),
        isNull(competitors.archived_at),
        or(
          ilike(competitors.name, searchPattern),
          ilike(competitors.category, searchPattern)
        )
      ),
      limit: MAX_RESULTS
    });
    results.competitors = competitorRows.map((row: any) => ({
      id: row.id,
      type: "competitor",
      title: row.name,
      subtitle: row.category || "Competitor",
      href: `${basePath}/competitors`
    }));

    // 5. Research
    const researchRows = await db.query.researchItems.findMany({
      where: and(
        eq(researchItems.product_id, productId),
        isNull(researchItems.archived_at),
        or(
          ilike(researchItems.title, searchPattern),
          ilike(researchItems.type, searchPattern)
        )
      ),
      limit: MAX_RESULTS
    });
    results.research = researchRows.map((row: any) => ({
      id: row.id,
      type: "research",
      title: row.title,
      subtitle: row.type,
      href: `${basePath}/research`
    }));

    // 6. Leads
    const leadRows = await db.query.leads.findMany({
      where: and(
        eq(leads.product_id, productId),
        isNull(leads.archived_at),
        or(
          ilike(leads.company, searchPattern),
          ilike(leads.contact, searchPattern)
        )
      ),
      limit: MAX_RESULTS
    });
    results.leads = leadRows.map((row: any) => ({
      id: row.id,
      type: "lead",
      title: row.company,
      subtitle: row.contact,
      href: `${basePath}/leads`
    }));

    // 7. Campaigns
    const campaignRows = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.product_id, productId),
        isNull(campaigns.archived_at),
        ilike(campaigns.name, searchPattern)
      ),
      limit: MAX_RESULTS
    });
    results.campaigns = campaignRows.map((row: any) => ({
      id: row.id,
      type: "campaign",
      title: row.name,
      subtitle: "Campaign",
      href: `${basePath}/campaigns`
    }));

    // 8. Experiments
    const experimentRows = await db.query.experiments.findMany({
      where: and(
        eq(experiments.product_id, productId),
        isNull(experiments.archived_at),
        ilike(experiments.name, searchPattern)
      ),
      limit: MAX_RESULTS
    });
    results.experiments = experimentRows.map((row: any) => ({
      id: row.id,
      type: "experiment",
      title: row.name,
      subtitle: "Experiment",
      href: `${basePath}/experiments`
    }));

    // 9. Learnings
    const learningRows = await db.query.learnings.findMany({
      where: and(
        eq(learnings.product_id, productId),
        isNull(learnings.archived_at),
        ilike(learnings.title, searchPattern)
      ),
      limit: MAX_RESULTS
    });
    results.learnings = learningRows.map((row: any) => ({
      id: row.id,
      type: "learning",
      title: row.title,
      subtitle: "Learning",
      href: `${basePath}/learnings`
    }));

    return { ok: true, data: results };
  } catch (err: any) {
    console.error("Search Error:", err);
    return { ok: false, error: "An error occurred while searching" };
  }
}
