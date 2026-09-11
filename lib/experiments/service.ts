import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { experiments } from "@/db/schema";
import { EXPERIMENT_STATUSES } from "./types";
import type { CreateExperimentInput, ExperimentResult, ExperimentRow, UpdateExperimentInput } from "./types";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createExperimentSchema = z.object({
  name: z.string().trim().min(1),
  hypothesis: z.string().trim().optional(),
  goal: z.string().trim().optional(),
  audience: z.string().trim().optional(),
  channel: z.string().trim().optional(),
  variant: z.string().trim().optional(),
  primary_metric: z.string().trim().optional(),
  secondary_metrics: z.array(z.string().trim()).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  budget: z.number().int().optional(),
  status: z.enum(EXPERIMENT_STATUSES).default("Idea"),
});

const updateExperimentSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    hypothesis: z.string().trim().nullable().optional(),
    goal: z.string().trim().nullable().optional(),
    audience: z.string().trim().nullable().optional(),
    channel: z.string().trim().nullable().optional(),
    variant: z.string().trim().nullable().optional(),
    primary_metric: z.string().trim().nullable().optional(),
    secondary_metrics: z.array(z.string().trim()).nullable().optional(),
    start_date: z.date().nullable().optional(),
    end_date: z.date().nullable().optional(),
    budget: z.number().int().nullable().optional(),
    status: z.enum(EXPERIMENT_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function err<T extends string>(code: T, message: string): { ok: false; error: { code: T; message: string; cause?: unknown } } {
  return { ok: false, error: { code, message } };
}

// ---------------------------------------------------------------------------
// Service operations
// ---------------------------------------------------------------------------

export async function createExperiment(
  productId: string,
  input: CreateExperimentInput,
): Promise<ExperimentResult<ExperimentRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  const parsed = createExperimentSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.path[0] === "name") return err("NAME_EMPTY", "Experiment name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  const data = parsed.data;

  try {
    const db = getDb();

    const rows = await db
      .insert(experiments)
      .values({
        product_id: productId,
        name: data.name,
        hypothesis: data.hypothesis,
        goal: data.goal,
        audience: data.audience,
        channel: data.channel,
        variant: data.variant,
        primary_metric: data.primary_metric,
        secondary_metrics: data.secondary_metrics,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget,
        status: data.status,
      })
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to create experiment.");
  }
}

export async function getExperimentsForProduct(
  productId: string,
): Promise<ExperimentResult<ExperimentRow[]>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.product_id, productId),
          isNull(experiments.archived_at)
        )
      )
      .orderBy(experiments.created_at);

    return { ok: true, data: rows };
  } catch {
    return err("UNKNOWN", "Failed to get experiments.");
  }
}

export async function getExperimentById(
  productId: string,
  experimentId: string,
): Promise<ExperimentResult<ExperimentRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(experimentId).success) {
    return err("EXPERIMENT_ID_INVALID", "Invalid experiment ID format");
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(experiments)
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.product_id, productId),
          isNull(experiments.archived_at)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return err("EXPERIMENT_NOT_FOUND", "Experiment not found or already archived.");
    }
    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to get experiment.");
  }
}

export async function updateExperiment(
  productId: string,
  experimentId: string,
  input: UpdateExperimentInput,
): Promise<ExperimentResult<ExperimentRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(experimentId).success) {
    return err("EXPERIMENT_ID_INVALID", "Invalid experiment ID format");
  }

  const parsed = updateExperimentSchema.safeParse(input);
  if (!parsed.success) {
    const error = parsed.error.issues[0];
    if (error.code === "custom") return err("NO_UPDATE_FIELDS", error.message);
    if (error.path[0] === "name") return err("NAME_EMPTY", "Experiment name is required");
    if (error.path[0] === "status") return err("STATUS_INVALID", "Invalid status");
    return err("UNKNOWN", error.message);
  }

  try {
    const db = getDb();
    const rows = await db
      .update(experiments)
      .set({
        ...parsed.data,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(experiments.id, experimentId),
          eq(experiments.product_id, productId),
          isNull(experiments.archived_at)
        )
      )
      .returning();

    if (rows.length === 0) {
      return err("EXPERIMENT_NOT_FOUND", "Experiment not found or already archived.");
    }

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to update experiment.");
  }
}

export async function archiveExperiment(
  productId: string,
  experimentId: string,
): Promise<ExperimentResult<ExperimentRow>> {
  if (!uuidSchema.safeParse(productId).success) {
    return err("PRODUCT_ID_INVALID", "Invalid product ID format");
  }
  if (!uuidSchema.safeParse(experimentId).success) {
    return err("EXPERIMENT_ID_INVALID", "Invalid experiment ID format");
  }

  try {
    const db = getDb();

    const checkRows = await db
      .select({ archived_at: experiments.archived_at })
      .from(experiments)
      .where(and(eq(experiments.id, experimentId), eq(experiments.product_id, productId)))
      .limit(1);

    if (checkRows.length === 0) {
      return err("EXPERIMENT_NOT_FOUND", "Experiment not found.");
    }
    if (checkRows[0].archived_at !== null) {
      return err("EXPERIMENT_ALREADY_ARCHIVED", "Experiment is already archived.");
    }

    const rows = await db
      .update(experiments)
      .set({ archived_at: new Date(), updated_at: new Date() })
      .where(eq(experiments.id, experimentId))
      .returning();

    return { ok: true, data: rows[0] };
  } catch {
    return err("UNKNOWN", "Failed to archive experiment.");
  }
}
