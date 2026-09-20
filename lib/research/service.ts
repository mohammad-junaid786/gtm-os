import "server-only";

import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { researchItems, competitors } from "@/db/schema";
import {
  type CreateResearchInput,
  type UpdateResearchInput,
  type ResearchItemRow,
  type ResearchResult,
  createResearchSchema,
  updateResearchSchema,
  fail,
} from "./types";

const uuidSchema = z.string().uuid();

export async function getResearchItemById(
  productId: string,
  researchItemId: string,
): Promise<ResearchResult<ResearchItemRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(researchItemId).success) {
    return fail({
      code: "RESEARCH_ITEM_ID_INVALID",
      message: "Invalid research item ID.",
    });
  }

  const db = getDb();
  const [item] = await db
    .select()
    .from(researchItems)
    .where(
      and(
        eq(researchItems.product_id, productId),
        eq(researchItems.id, researchItemId),
      ),
    )
    .limit(1);

  if (!item) {
    return fail({
      code: "RESEARCH_ITEM_NOT_FOUND",
      message: "Research item not found.",
    });
  }

  return { ok: true, data: item };
}

export async function createResearchItem(
  input: CreateResearchInput,
): Promise<ResearchResult<ResearchItemRow>> {
  const parsed = createResearchSchema.safeParse(input);
  if (!parsed.success) {
    const isWebsiteError = parsed.error.issues.some(
      (i) => i.path[0] === "source_url",
    );
    if (isWebsiteError) {
      return fail({
        code: "WEBSITE_INVALID",
        message: "Website must be a valid http:// or https:// URL.",
      });
    }

    return fail({
      code: "UNKNOWN",
      message: "Validation failed.",
      cause: parsed.error.issues,
    });
  }

  const data = parsed.data;
  const db = getDb();

  // If competitorId is provided, verify it belongs to this product and is active.
  if (data.competitorId) {
    const [comp] = await db
      .select({ archived_at: competitors.archived_at })
      .from(competitors)
      .where(
        and(
          eq(competitors.product_id, data.productId),
          eq(competitors.id, data.competitorId),
        ),
      )
      .limit(1);

    if (!comp) {
      return fail({
        code: "COMPETITOR_NOT_FOUND",
        message: "Competitor not found.",
      });
    }
    if (comp.archived_at !== null) {
      return fail({
        code: "COMPETITOR_ARCHIVED",
        message: "Cannot link to an archived competitor.",
      });
    }
  }

  try {
    const [inserted] = await db
      .insert(researchItems)
      .values({
        product_id: data.productId,
        competitor_id: data.competitorId ?? null,
        title: data.title,
        type: data.type,
        source_name: data.source_name ?? null,
        source_url: data.source_url ?? null,
        content: data.content ?? null,
        date_researched: data.date_researched ?? null,
      })
      .returning();

    return { ok: true, data: inserted };
  } catch (err: unknown) {
    return fail({
      code: "UNKNOWN",
      message: "Failed to create research item.",
      cause: err,
    });
  }
}

export async function updateResearchItem(
  productId: string,
  researchItemId: string,
  input: UpdateResearchInput,
): Promise<ResearchResult<ResearchItemRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(researchItemId).success) {
    return fail({
      code: "RESEARCH_ITEM_ID_INVALID",
      message: "Invalid research item ID.",
    });
  }

  const parsed = updateResearchSchema.safeParse(input);
  if (!parsed.success) {
    const isNoFields = parsed.error.issues.some(
      (i) =>
        i.code === z.ZodIssueCode.custom &&
        i.message === "At least one field must be provided for update.",
    );
    if (isNoFields) {
      return fail({
        code: "NO_UPDATE_FIELDS",
        message: "At least one field must be provided for update.",
      });
    }

    const isWebsiteError = parsed.error.issues.some(
      (i) => i.path[0] === "source_url",
    );
    if (isWebsiteError) {
      return fail({
        code: "WEBSITE_INVALID",
        message: "Website must be a valid http:// or https:// URL.",
      });
    }

    return fail({
      code: "UNKNOWN",
      message: "Validation failed.",
      cause: parsed.error.issues,
    });
  }

  const data = parsed.data;
  const db = getDb();

  // 1. Ownership & Active check
  const [current] = await db
    .select({ archived_at: researchItems.archived_at })
    .from(researchItems)
    .where(
      and(
        eq(researchItems.product_id, productId),
        eq(researchItems.id, researchItemId),
      ),
    )
    .limit(1);

  if (!current) {
    return fail({
      code: "RESEARCH_ITEM_NOT_FOUND",
      message: "Research item not found.",
    });
  }
  if (current.archived_at !== null) {
    return fail({
      code: "RESEARCH_ITEM_ALREADY_ARCHIVED",
      message: "Cannot update an archived research item.",
    });
  }

  // 2. Competitor validation
  if (data.competitorId) {
    const [comp] = await db
      .select({ archived_at: competitors.archived_at })
      .from(competitors)
      .where(
        and(
          eq(competitors.product_id, productId),
          eq(competitors.id, data.competitorId),
        ),
      )
      .limit(1);

    if (!comp) {
      return fail({
        code: "COMPETITOR_NOT_FOUND",
        message: "Competitor not found.",
      });
    }
    if (comp.archived_at !== null) {
      return fail({
        code: "COMPETITOR_ARCHIVED",
        message: "Cannot link to an archived competitor.",
      });
    }
  }

  // 3. Update
  const updateData: Partial<typeof researchItems.$inferInsert> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.competitorId !== undefined) updateData.competitor_id = data.competitorId;
  if (data.source_name !== undefined) updateData.source_name = data.source_name ?? null;
  if (data.source_url !== undefined) updateData.source_url = data.source_url ?? null;
  if (data.content !== undefined) updateData.content = data.content ?? null;
  if (data.date_researched !== undefined) updateData.date_researched = data.date_researched ?? null;

  updateData.updated_at = new Date();

  try {
    const [updated] = await db
      .update(researchItems)
      .set(updateData)
      .where(and(eq(researchItems.product_id, productId), eq(researchItems.id, researchItemId)))
      .returning();

    return { ok: true, data: updated };
  } catch (err: unknown) {
    return fail({
      code: "UNKNOWN",
      message: "Failed to update research item.",
      cause: err,
    });
  }
}

export async function listResearchItemsForProduct(
  productId: string,
): Promise<ResearchResult<ResearchItemRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(researchItems)
      .where(
        and(
          eq(researchItems.product_id, productId),
          isNull(researchItems.archived_at),
        ),
      )
      .orderBy(desc(researchItems.created_at));

    return { ok: true, data: rows };
  } catch (err: unknown) {
    return fail({
      code: "UNKNOWN",
      message: "Failed to list research items.",
      cause: err,
    });
  }
}

export async function archiveResearchItem(
  productId: string,
  researchItemId: string,
): Promise<ResearchResult<ResearchItemRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(researchItemId).success) {
    return fail({
      code: "RESEARCH_ITEM_ID_INVALID",
      message: "Invalid research item ID.",
    });
  }

  const db = getDb();
  
  // Need to verify it exists and belongs to product
  const [current] = await db
    .select({ id: researchItems.id, archived_at: researchItems.archived_at })
    .from(researchItems)
    .where(
      and(
        eq(researchItems.product_id, productId),
        eq(researchItems.id, researchItemId),
      ),
    )
    .limit(1);

  if (!current) {
    return fail({
      code: "RESEARCH_ITEM_NOT_FOUND",
      message: "Research item not found.",
    });
  }
  if (current.archived_at !== null) {
    return fail({
      code: "RESEARCH_ITEM_ALREADY_ARCHIVED",
      message: "Research item is already archived.",
    });
  }

  try {
    const [archived] = await db
      .update(researchItems)
      .set({ archived_at: new Date() })
      .where(
        and(
          eq(researchItems.product_id, productId),
          eq(researchItems.id, researchItemId),
        ),
      )
      .returning();

    return { ok: true, data: archived };
  } catch (err: unknown) {
    return fail({
      code: "UNKNOWN",
      message: "Failed to archive research item.",
      cause: err,
    });
  }
}
