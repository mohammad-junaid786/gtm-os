import "server-only";

import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "../../db";
import { learnings, campaigns, experiments, leads, researchItems, competitors } from "../../db/schema";
import {
  type LearningRow,
  type CreateLearningInput,
  type UpdateLearningInput,
  type LearningResult,
  createLearningSchema,
  updateLearningSchema,
} from "./types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function validateSourceEntity(
  productId: string,
  sourceType: string | null | undefined,
  sourceId: string | null | undefined
): Promise<boolean> {
  if (!sourceId || !sourceType) return true;
  if (!UUID_REGEX.test(sourceId)) return false;

  const db = getDb();

  try {
    if (sourceType === "campaign") {
      const row = await db.query.campaigns.findFirst({
        where: and(eq(campaigns.id, sourceId), eq(campaigns.product_id, productId)),
        columns: { id: true },
      });
      return !!row;
    } else if (sourceType === "experiment") {
      const row = await db.query.experiments.findFirst({
        where: and(eq(experiments.id, sourceId), eq(experiments.product_id, productId)),
        columns: { id: true },
      });
      return !!row;
    } else if (sourceType === "lead") {
      const row = await db.query.leads.findFirst({
        where: and(eq(leads.id, sourceId), eq(leads.product_id, productId)),
        columns: { id: true },
      });
      return !!row;
    } else if (sourceType === "research") {
      const row = await db.query.researchItems.findFirst({
        where: and(eq(researchItems.id, sourceId), eq(researchItems.product_id, productId)),
        columns: { id: true },
      });
      return !!row;
    } else if (sourceType === "competitor") {
      const row = await db.query.competitors.findFirst({
        where: and(eq(competitors.id, sourceId), eq(competitors.product_id, productId)),
        columns: { id: true },
      });
      return !!row;
    }
    // For "analytics" or "other", we don't have a specific table to validate against.
    // If a UUID is provided, we accept it.
    return true;
  } catch {
    return false;
  }
}

export async function createLearning(
  productId: string,
  input: CreateLearningInput
): Promise<LearningResult<LearningRow>> {
  if (!UUID_REGEX.test(productId)) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  const parsed = createLearningSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const data = parsed.data;

  const isValidSource = await validateSourceEntity(productId, data.source_type, data.source_id);
  if (!isValidSource) {
    return { ok: false, error: "SOURCE_NOT_FOUND_IN_PRODUCT" };
  }

  try {
    const db = getDb();
    const [inserted] = await db
      .insert(learnings)
      .values({
        product_id: productId,
        title: data.title,
        insight: data.insight,
        source_type: data.source_type ?? null,
        source_id: data.source_id ?? null,
        confidence_level: data.confidence_level ?? null,
        impact_level: data.impact_level ?? null,
        action_items: data.action_items ?? null,
      })
      .returning();

    return { ok: true, data: inserted };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getLearningsForProduct(
  productId: string
): Promise<LearningResult<LearningRow[]>> {
  if (!UUID_REGEX.test(productId)) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }

  try {
    const db = getDb();
    const rows = await db.query.learnings.findMany({
      where: and(eq(learnings.product_id, productId), isNull(learnings.archived_at)),
      orderBy: (table, { desc }) => [desc(table.created_at)],
    });

    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function getLearningById(
  productId: string,
  learningId: string
): Promise<LearningResult<LearningRow>> {
  if (!UUID_REGEX.test(productId)) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  if (!UUID_REGEX.test(learningId)) {
    return { ok: false, error: "LEARNING_ID_INVALID" };
  }

  try {
    const db = getDb();
    const row = await db.query.learnings.findFirst({
      where: and(eq(learnings.id, learningId), eq(learnings.product_id, productId)),
    });

    if (!row) {
      return { ok: false, error: "LEARNING_NOT_FOUND" };
    }

    return { ok: true, data: row };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function updateLearning(
  productId: string,
  learningId: string,
  input: UpdateLearningInput
): Promise<LearningResult<LearningRow>> {
  if (!UUID_REGEX.test(productId)) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  if (!UUID_REGEX.test(learningId)) {
    return { ok: false, error: "LEARNING_ID_INVALID" };
  }

  const parsed = updateLearningSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  if (Object.keys(parsed.data).length === 0) {
    return { ok: false, error: "NO_UPDATE_FIELDS" };
  }

  const data = parsed.data;

  // If source fields are being updated, validate them
  if (data.source_type !== undefined || data.source_id !== undefined) {
    // If only one is provided in the update, we might need the existing row to fully validate.
    // For simplicity, we fetch the existing row to ensure we validate the final combination.
    const db = getDb();
    const existing = await db.query.learnings.findFirst({
      where: and(eq(learnings.id, learningId), eq(learnings.product_id, productId)),
    });
    if (!existing) {
      return { ok: false, error: "LEARNING_NOT_FOUND" };
    }
    if (existing.archived_at !== null) {
      return { ok: false, error: "LEARNING_ALREADY_ARCHIVED" };
    }

    const finalSourceType = data.source_type !== undefined ? data.source_type : existing.source_type;
    const finalSourceId = data.source_id !== undefined ? data.source_id : existing.source_id;

    const isValidSource = await validateSourceEntity(productId, finalSourceType, finalSourceId);
    if (!isValidSource) {
      return { ok: false, error: "SOURCE_NOT_FOUND_IN_PRODUCT" };
    }
  }

  try {
    const db = getDb();

    // Verify existing state in a transaction for safety, or just do an update with returning
    // We must ensure it's not archived
    const [updated] = await db
      .update(learnings)
      .set({
        title: data.title,
        insight: data.insight,
        source_type: data.source_type,
        source_id: data.source_id,
        confidence_level: data.confidence_level,
        impact_level: data.impact_level,
        action_items: data.action_items,
        updated_at: new Date(),
      })
      .where(and(
        eq(learnings.id, learningId),
        eq(learnings.product_id, productId),
        isNull(learnings.archived_at)
      ))
      .returning();

    if (!updated) {
      // Check if it exists but is archived
      const checkRow = await db.query.learnings.findFirst({
        where: and(eq(learnings.id, learningId), eq(learnings.product_id, productId)),
      });
      if (!checkRow) {
        return { ok: false, error: "LEARNING_NOT_FOUND" };
      }
      if (checkRow.archived_at !== null) {
        return { ok: false, error: "LEARNING_ALREADY_ARCHIVED" };
      }
      return { ok: false, error: "UNKNOWN" }; // Should not happen
    }

    return { ok: true, data: updated };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function archiveLearning(
  productId: string,
  learningId: string
): Promise<LearningResult<LearningRow>> {
  if (!UUID_REGEX.test(productId)) {
    return { ok: false, error: "PRODUCT_ID_INVALID" };
  }
  if (!UUID_REGEX.test(learningId)) {
    return { ok: false, error: "LEARNING_ID_INVALID" };
  }

  try {
    const db = getDb();
    const [archived] = await db
      .update(learnings)
      .set({
        archived_at: new Date(),
        updated_at: new Date(),
      })
      .where(and(
        eq(learnings.id, learningId),
        eq(learnings.product_id, productId),
        isNull(learnings.archived_at)
      ))
      .returning();

    if (!archived) {
      const checkRow = await db.query.learnings.findFirst({
        where: and(eq(learnings.id, learningId), eq(learnings.product_id, productId)),
      });
      if (!checkRow) {
        return { ok: false, error: "LEARNING_NOT_FOUND" };
      }
      if (checkRow.archived_at !== null) {
        return { ok: false, error: "LEARNING_ALREADY_ARCHIVED" };
      }
      return { ok: false, error: "UNKNOWN" };
    }

    return { ok: true, data: archived };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
