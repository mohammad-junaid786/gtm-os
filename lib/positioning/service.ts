/**
 * Positioning service — server-side only.
 *
 * All operations are product-scoped. A positioning ID alone is never sufficient
 * context — every method requires an explicit productId to prevent
 * cross-product access (IDOR).
 *
 * Authorization boundary:
 *   The service does NOT perform authentication or workspace membership checks.
 *   Callers (Server Actions via authorizeProductAction) are responsible for
 *   establishing that the authenticated user has access to the given product
 *   before calling any service function.
 *
 * Design decisions (from docs/architecture.md Stage 12):
 * - One active positioning per product at MVP. Enforced at BOTH the service
 *   layer (pre-insert check for a friendlier error) AND the database level
 *   (partial unique index: UNIQUE(product_id) WHERE archived_at IS NULL).
 *   The DB constraint is the final authority and prevents concurrent inserts.
 * - All text fields are optional. Positioning is developed iteratively.
 * - Positioning records are never hard-deleted; archiving sets archived_at.
 * - Active positioning: archived_at IS NULL.
 * - Archived positioning: archived_at IS NOT NULL.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { positioning } from "@/db/schema";
import {
  createPositioningSchema,
  updatePositioningSchema,
} from "./types";
import type {
  CreatePositioningInput,
  UpdatePositioningInput,
  PositioningRow,
  PositioningResult,
  PositioningServiceError,
} from "./types";

// ---------------------------------------------------------------------------
// Zod schemas (local — UUID validation only; content schemas live in types.ts)
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// PostgreSQL error codes
// ---------------------------------------------------------------------------

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): err is { code: string; constraint?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fail(error: PositioningServiceError): PositioningResult<never> {
  return { ok: false, error };
}

/** Map a DB row to the public PositioningRow type. */
function toPositioningRow(row: {
  id: string;
  product_id: string;
  positioning_statement: string | null;
  target_customer: string | null;
  customer_problem: string | null;
  unique_value: string | null;
  alternatives: string[] | null;
  proof_points: string[] | null;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): PositioningRow {
  return {
    id: row.id,
    product_id: row.product_id,
    positioning_statement: row.positioning_statement,
    target_customer: row.target_customer,
    customer_problem: row.customer_problem,
    unique_value: row.unique_value,
    alternatives: row.alternatives,
    proof_points: row.proof_points,
    notes: row.notes,
    archived_at: row.archived_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a positioning record for a product.
 *
 * Enforces the one-active-positioning-per-product constraint at TWO levels:
 *   1. Pre-insert check (service layer): returns POSITIONING_ALREADY_EXISTS if
 *      an active record exists. Provides a clear error for the normal case.
 *   2. Partial unique index (database level): catches concurrent inserts that
 *      race past the pre-insert check. DB violation is also mapped to
 *      POSITIONING_ALREADY_EXISTS so the error code is consistent.
 *
 * All text fields are optional — positioning is developed iteratively.
 *
 * @param input - productId (required) + optional structured fields.
 */
export async function createPositioning(
  input: CreatePositioningInput,
): Promise<PositioningResult<PositioningRow>> {
  const parsed = createPositioningSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path.includes("productId")) {
      return fail({ code: "PRODUCT_ID_INVALID", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  const { productId, ...fields } = parsed.data;

  try {
    const db = getDb();

    // One-active-positioning-per-product guard
    const existing = await db
      .select({ id: positioning.id })
      .from(positioning)
      .where(and(eq(positioning.product_id, productId), isNull(positioning.archived_at)))
      .limit(1);

    if (existing.length > 0) {
      return fail({
        code: "POSITIONING_ALREADY_EXISTS",
        message:
          "An active positioning already exists for this product. Archive the existing positioning before creating a new one.",
      });
    }

    const [row] = await db
      .insert(positioning)
      .values({
        product_id: productId,
        positioning_statement: fields.positioning_statement ?? null,
        target_customer: fields.target_customer ?? null,
        customer_problem: fields.customer_problem ?? null,
        unique_value: fields.unique_value ?? null,
        alternatives: fields.alternatives ?? null,
        proof_points: fields.proof_points ?? null,
        notes: fields.notes ?? null,
      })
      .returning();

    return { ok: true, data: toPositioningRow(row) };
  } catch (e) {
    // The partial unique index (UNIQUE(product_id) WHERE archived_at IS NULL)
    // is the database-level enforcement of the one-active-positioning invariant.
    // Catch unique violations here so concurrent inserts that race past the
    // pre-insert check still return the correct domain error.
    if (isUniqueViolation(e)) {
      return fail({
        code: "POSITIONING_ALREADY_EXISTS",
        message:
          "An active positioning already exists for this product. Archive the existing positioning before creating a new one.",
      });
    }
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Retrieve the active positioning for a product, or null if none exists.
 *
 * Returns null instead of an error when no active positioning is found —
 * callers use null as the "empty state" trigger.
 *
 * @param productId - UUID of the product whose active positioning to retrieve.
 */
export async function getPositioningForProduct(
  productId: string,
): Promise<PositioningResult<PositioningRow | null>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(positioning)
      .where(and(eq(positioning.product_id, productId), isNull(positioning.archived_at)))
      .limit(1);

    return { ok: true, data: rows.length > 0 ? toPositioningRow(rows[0]) : null };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Retrieve a positioning record by ID, scoped to a product.
 *
 * Returns POSITIONING_NOT_FOUND if the record does not exist OR belongs to a
 * different product — callers cannot distinguish the two cases (oracle prevention).
 *
 * Returns both active and archived records.
 *
 * @param productId      - The product this record must belong to.
 * @param positioningId  - UUID of the positioning record to retrieve.
 */
export async function getPositioningById(
  productId: string,
  positioningId: string,
): Promise<PositioningResult<PositioningRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const posid = uuidSchema.safeParse(positioningId);
  if (!posid.success) {
    return fail({ code: "POSITIONING_ID_INVALID", message: "positioningId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(positioning)
      .where(and(eq(positioning.product_id, productId), eq(positioning.id, positioningId)))
      .limit(1);

    if (rows.length === 0) {
      return fail({ code: "POSITIONING_NOT_FOUND", message: "Positioning not found." });
    }
    return { ok: true, data: toPositioningRow(rows[0]) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Update mutable fields on an active positioning record.
 *
 * The operation is product-scoped: a positioningId belonging to a different
 * product returns POSITIONING_NOT_FOUND. Archived records cannot be updated.
 *
 * At least one field must be provided (enforced by Zod).
 *
 * @param productId     - The product this record must belong to.
 * @param positioningId - UUID of the positioning record to update.
 * @param input         - Fields to update (all optional, at least one required).
 */
export async function updatePositioning(
  productId: string,
  positioningId: string,
  input: UpdatePositioningInput,
): Promise<PositioningResult<PositioningRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const posid = uuidSchema.safeParse(positioningId);
  if (!posid.success) {
    return fail({ code: "POSITIONING_ID_INVALID", message: "positioningId must be a valid UUID." });
  }

  const parsed = updatePositioningSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.code === "custom") {
      return fail({ code: "NO_UPDATE_FIELDS", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  try {
    const db = getDb();

    // Confirm ownership and active status before updating
    const existing = await db
      .select()
      .from(positioning)
      .where(and(eq(positioning.product_id, productId), eq(positioning.id, positioningId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "POSITIONING_NOT_FOUND", message: "Positioning not found." });
    }

    if (existing[0].archived_at !== null) {
      return fail({
        code: "POSITIONING_ALREADY_ARCHIVED",
        message: "Cannot update an archived positioning record.",
      });
    }

    const data = parsed.data;
    const now = new Date();

    // Build update patch — only include explicitly provided fields
    const patch: Record<string, unknown> = { updated_at: now };
    if ("positioning_statement" in data) patch.positioning_statement = data.positioning_statement ?? null;
    if ("target_customer" in data) patch.target_customer = data.target_customer ?? null;
    if ("customer_problem" in data) patch.customer_problem = data.customer_problem ?? null;
    if ("unique_value" in data) patch.unique_value = data.unique_value ?? null;
    if ("alternatives" in data) patch.alternatives = data.alternatives ?? null;
    if ("proof_points" in data) patch.proof_points = data.proof_points ?? null;
    if ("notes" in data) patch.notes = data.notes ?? null;

    const [updated] = await db
      .update(positioning)
      .set(patch)
      .where(and(eq(positioning.product_id, productId), eq(positioning.id, positioningId)))
      .returning();

    return { ok: true, data: toPositioningRow(updated) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Archive a positioning record within a product.
 *
 * Sets `archived_at` to the current timestamp. The row remains in the database.
 * Archiving an already-archived record returns POSITIONING_ALREADY_ARCHIVED.
 * The operation is product-scoped: a positioningId belonging to a different
 * product returns POSITIONING_NOT_FOUND.
 *
 * @param productId     - The product this record must belong to.
 * @param positioningId - UUID of the positioning record to archive.
 */
export async function archivePositioning(
  productId: string,
  positioningId: string,
): Promise<PositioningResult<PositioningRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const posid = uuidSchema.safeParse(positioningId);
  if (!posid.success) {
    return fail({ code: "POSITIONING_ID_INVALID", message: "positioningId must be a valid UUID." });
  }

  try {
    const db = getDb();

    const existing = await db
      .select()
      .from(positioning)
      .where(and(eq(positioning.product_id, productId), eq(positioning.id, positioningId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "POSITIONING_NOT_FOUND", message: "Positioning not found." });
    }

    if (existing[0].archived_at !== null) {
      return fail({
        code: "POSITIONING_ALREADY_ARCHIVED",
        message: "Positioning is already archived.",
      });
    }

    const now = new Date();
    const [archived] = await db
      .update(positioning)
      .set({ archived_at: now, updated_at: now })
      .where(and(eq(positioning.product_id, productId), eq(positioning.id, positioningId)))
      .returning();

    return { ok: true, data: toPositioningRow(archived) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}
