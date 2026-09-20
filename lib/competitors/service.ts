import "server-only";

import { and, eq, isNull, asc, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { competitors } from "@/db/schema";
import {
  createCompetitorSchema,
  updateCompetitorSchema,
  type CompetitorRow,
  type CreateCompetitorInput,
  type UpdateCompetitorInput,
  type CompetitorResult,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

function normalizeName(raw: string): string {
  return raw.trim().toLowerCase();
}

function fail(
  error: Extract<CompetitorResult<never>, { ok: false }>["error"]
): CompetitorResult<never> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCompetitorById(
  productId: string,
  competitorId: string,
): Promise<CompetitorResult<CompetitorRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(competitorId).success) {
    return fail({
      code: "COMPETITOR_ID_INVALID",
      message: "Invalid competitor ID.",
    });
  }

  const db = getDb();
  const row = await db.query.competitors.findFirst({
    where: and(
      eq(competitors.product_id, productId),
      eq(competitors.id, competitorId),
    ),
  });

  if (!row) {
    return fail({
      code: "COMPETITOR_NOT_FOUND",
      message: "Competitor not found or does not belong to this product.",
    });
  }

  return { ok: true, data: row };
}

export async function listCompetitorsForProduct(
  productId: string,
): Promise<CompetitorResult<CompetitorRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }

  const db = getDb();
  const rows = await db.query.competitors.findMany({
    where: and(
      eq(competitors.product_id, productId),
      isNull(competitors.archived_at),
    ),
    orderBy: [asc(competitors.name_normalized)],
  });

  return { ok: true, data: rows };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCompetitor(
  input: CreateCompetitorInput,
): Promise<CompetitorResult<CompetitorRow>> {
  if (!uuidSchema.safeParse(input.productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }

  const parsed = createCompetitorSchema.safeParse(input);
  if (!parsed.success) {
    const isWebsiteError = parsed.error.issues.some((i) => i.path[0] === "website");
    if (isWebsiteError) {
      return fail({
        code: "WEBSITE_INVALID",
        message: "Website must be a valid http:// or https:// URL.",
      });
    }

    const isNameEmpty = parsed.error.issues.some((i) => i.path[0] === "name");
    if (isNameEmpty) {
      return fail({ code: "NAME_EMPTY", message: "Competitor name cannot be empty." });
    }

    return fail({
      code: "UNKNOWN",
      message: "Validation failed.",
      cause: parsed.error.issues,
    });
  }

  const data = parsed.data;
  const name_normalized = normalizeName(data.name);

  if (name_normalized.length === 0) {
    return fail({ code: "NAME_EMPTY", message: "Competitor name cannot be empty." });
  }

  const db = getDb();

  // 1. Pre-insert duplicate check (friendlier error)
  const existing = await db
    .select({ id: competitors.id })
    .from(competitors)
    .where(
      and(
        eq(competitors.product_id, data.productId),
        eq(competitors.name_normalized, name_normalized),
        isNull(competitors.archived_at),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return fail({
      code: "COMPETITOR_ALREADY_EXISTS",
      message: "An active competitor with this name already exists for this product.",
    });
  }

  // 2. Insert
  try {
    const [inserted] = await db
      .insert(competitors)
      .values({
        product_id: data.productId,
        name: data.name,
        name_normalized,
        website: data.website ?? null,
        category: data.category ?? null,
        description: data.description ?? null,
        strengths: data.strengths ?? null,
        weaknesses: data.weaknesses ?? null,
        differentiators: data.differentiators ?? null,
        pricing_notes: data.pricing_notes ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return { ok: true, data: inserted };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505" && "constraint" in err && err.constraint === "competitors_one_active_per_product_name") {
      return fail({
        code: "COMPETITOR_ALREADY_EXISTS",
        message: "An active competitor with this name already exists for this product.",
      });
    }
    return fail({
      code: "UNKNOWN",
      message: "Failed to create competitor.",
      cause: err,
    });
  }
}

export async function updateCompetitor(
  productId: string,
  competitorId: string,
  input: UpdateCompetitorInput,
): Promise<CompetitorResult<CompetitorRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(competitorId).success) {
    return fail({
      code: "COMPETITOR_ID_INVALID",
      message: "Invalid competitor ID.",
    });
  }

  const parsed = updateCompetitorSchema.safeParse(input);
  if (!parsed.success) {
    const isNoFields = parsed.error.issues.some((i) => i.code === z.ZodIssueCode.custom && i.message === "At least one field must be provided for update.");
    if (isNoFields) {
      return fail({
        code: "NO_UPDATE_FIELDS",
        message: "At least one field must be provided for update.",
      });
    }

    const isWebsiteError = parsed.error.issues.some((i) => i.path[0] === "website");
    if (isWebsiteError) {
      return fail({
        code: "WEBSITE_INVALID",
        message: "Website must be a valid http:// or https:// URL.",
      });
    }

    const isNameEmpty = parsed.error.issues.some((i) => i.path[0] === "name");
    if (isNameEmpty) {
      return fail({ code: "NAME_EMPTY", message: "Competitor name cannot be empty." });
    }

    return fail({
      code: "UNKNOWN",
      message: "Validation failed.",
      cause: parsed.error.issues,
    });
  }

  const data = parsed.data;
  let name_normalized: string | undefined = undefined;

  if (data.name !== undefined) {
    name_normalized = normalizeName(data.name);
    if (name_normalized.length === 0) {
      return fail({ code: "NAME_EMPTY", message: "Competitor name cannot be empty." });
    }
  }

  const db = getDb();

  // 1. Ownership & Active check
  const current = await db
    .select({ archived_at: competitors.archived_at })
    .from(competitors)
    .where(
      and(
        eq(competitors.product_id, productId),
        eq(competitors.id, competitorId),
      ),
    )
    .limit(1);

  if (current.length === 0) {
    return fail({
      code: "COMPETITOR_NOT_FOUND",
      message: "Competitor not found or does not belong to this product.",
    });
  }
  if (current[0].archived_at !== null) {
    return fail({
      code: "COMPETITOR_ALREADY_ARCHIVED",
      message: "Cannot update an archived competitor.",
    });
  }

  // 2. Duplicate check if name is changing
  if (name_normalized !== undefined) {
    const existing = await db
      .select({ id: competitors.id })
      .from(competitors)
      .where(
        and(
          eq(competitors.product_id, productId),
          eq(competitors.name_normalized, name_normalized),
          isNull(competitors.archived_at),
          ne(competitors.id, competitorId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return fail({
        code: "COMPETITOR_ALREADY_EXISTS",
        message: "An active competitor with this name already exists for this product.",
      });
    }
  }

  // 3. Update
  const updateData: Partial<typeof competitors.$inferInsert> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (name_normalized !== undefined) updateData.name_normalized = name_normalized;
  if (data.website !== undefined) updateData.website = data.website ?? null;
  if (data.category !== undefined) updateData.category = data.category ?? null;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.strengths !== undefined) updateData.strengths = data.strengths ?? null;
  if (data.weaknesses !== undefined) updateData.weaknesses = data.weaknesses ?? null;
  if (data.differentiators !== undefined) updateData.differentiators = data.differentiators ?? null;
  if (data.pricing_notes !== undefined) updateData.pricing_notes = data.pricing_notes ?? null;
  if (data.notes !== undefined) updateData.notes = data.notes ?? null;
  
  updateData.updated_at = new Date();

  try {
    const [updated] = await db
      .update(competitors)
      .set(updateData)
      .where(and(eq(competitors.product_id, productId), eq(competitors.id, competitorId)))
      .returning();

    return { ok: true, data: updated };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505" && "constraint" in err && err.constraint === "competitors_one_active_per_product_name") {
      return fail({
        code: "COMPETITOR_ALREADY_EXISTS",
        message: "An active competitor with this name already exists for this product.",
      });
    }
    return fail({
      code: "UNKNOWN",
      message: "Failed to update competitor.",
      cause: err,
    });
  }
}

export async function archiveCompetitor(
  productId: string,
  competitorId: string,
): Promise<CompetitorResult<CompetitorRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "Invalid product ID." });
  }
  if (!uuidSchema.safeParse(competitorId).success) {
    return fail({
      code: "COMPETITOR_ID_INVALID",
      message: "Invalid competitor ID.",
    });
  }

  const db = getDb();

  // 1. Ownership & Active check
  const current = await db
    .select({ archived_at: competitors.archived_at })
    .from(competitors)
    .where(
      and(
        eq(competitors.product_id, productId),
        eq(competitors.id, competitorId),
      ),
    )
    .limit(1);

  if (current.length === 0) {
    return fail({
      code: "COMPETITOR_NOT_FOUND",
      message: "Competitor not found or does not belong to this product.",
    });
  }
  if (current[0].archived_at !== null) {
    return fail({
      code: "COMPETITOR_ALREADY_ARCHIVED",
      message: "Competitor is already archived.",
    });
  }

  // 2. Archive
  try {
    const [archived] = await db
      .update(competitors)
      .set({
        archived_at: new Date(),
        updated_at: new Date(),
      })
      .where(and(eq(competitors.product_id, productId), eq(competitors.id, competitorId)))
      .returning();

    return { ok: true, data: archived };
  } catch (err: unknown) {
    return fail({
      code: "UNKNOWN",
      message: "Failed to archive competitor.",
      cause: err,
    });
  }
}
