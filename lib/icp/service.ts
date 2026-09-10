/**
 * ICP service — server-side only.
 *
 * All operations are product-scoped. An ICP ID alone is never sufficient
 * context — every method requires an explicit productId to prevent
 * cross-product access (IDOR).
 *
 * Authorization boundary:
 *   The service does NOT perform authentication or workspace membership checks.
 *   Callers (Server Actions via authorizeProductAccess) are responsible for
 *   establishing that the authenticated user has access to the given product
 *   before calling any service function.
 *
 * Design decisions (from docs/architecture.md Stage 6):
 * - ICPs belong to exactly one product via product_id FK.
 * - One ICP per product at MVP. Enforced at BOTH the service layer
 *   (pre-insert check for a friendlier error) AND the database level
 *   (partial unique index: UNIQUE(product_id) WHERE archived_at IS NULL).
 *   The DB constraint is the final authority and prevents concurrent inserts.
 * - ICPs are never hard-deleted; archiving sets archived_at.
 * - Active ICP: archived_at IS NULL.
 * - Archived ICP: archived_at IS NOT NULL.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { icps } from "@/db/schema";
import { BUSINESS_MODELS } from "./types";
import type {
  CreateIcpInput,
  UpdateIcpInput,
  IcpRow,
  IcpResult,
  IcpServiceError,
  BusinessModel,
} from "./types";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const businessModelSchema = z.enum(BUSINESS_MODELS).nullable().optional();

const nonEmptyString = z.string().min(1).max(2000).optional();
const stringArray = z.array(z.string().min(1).max(500)).optional();

const createIcpSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  name: z.string().min(1, "ICP name cannot be empty").max(255),
  description: nonEmptyString,
  industry: nonEmptyString,
  company_size: nonEmptyString,
  geography: nonEmptyString,
  business_model: businessModelSchema,
  pain_points: stringArray,
  goals: stringArray,
  buying_signals: stringArray,
  disqualifiers: stringArray,
  notes: z.string().max(10000).optional(),
});

const updateIcpSchema = z
  .object({
    name: z.string().min(1, "ICP name cannot be empty").max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    industry: z.string().max(255).nullable().optional(),
    company_size: z.string().max(100).nullable().optional(),
    geography: z.string().max(255).nullable().optional(),
    business_model: businessModelSchema,
    pain_points: z.array(z.string().min(1).max(500)).nullable().optional(),
    goals: z.array(z.string().min(1).max(500)).nullable().optional(),
    buying_signals: z.array(z.string().min(1).max(500)).nullable().optional(),
    disqualifiers: z.array(z.string().min(1).max(500)).nullable().optional(),
    notes: z.string().max(10000).nullable().optional(),
  })
  .refine(
    (d) =>
      Object.values(d).some((v) => v !== undefined),
    { message: "At least one field must be provided for update." },
  );

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

function fail(error: IcpServiceError): IcpResult<never> {
  return { ok: false, error };
}

/** Map a DB row to the public IcpRow type. */
function toIcpRow(row: {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  geography: string | null;
  business_model: string | null;
  pain_points: string[] | null;
  goals: string[] | null;
  buying_signals: string[] | null;
  disqualifiers: string[] | null;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): IcpRow {
  return {
    id: row.id,
    product_id: row.product_id,
    name: row.name,
    description: row.description,
    industry: row.industry,
    company_size: row.company_size,
    geography: row.geography,
    business_model: (row.business_model ?? null) as BusinessModel | null,
    pain_points: row.pain_points,
    goals: row.goals,
    buying_signals: row.buying_signals,
    disqualifiers: row.disqualifiers,
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
 * Create an ICP for a product.
 *
 * Enforces the one-active-ICP-per-product constraint at TWO levels:
 *   1. Pre-insert check (service layer): returns ICP_ALREADY_EXISTS if an
 *      active ICP exists. Provides a clear error for the normal case.
 *   2. Partial unique index (database level): catches concurrent inserts that
 *      race past the pre-insert check. DB violation is also mapped to
 *      ICP_ALREADY_EXISTS so the error code is consistent.
 *
 * @param input - productId + name (required) + optional structured fields.
 */
export async function createIcp(input: CreateIcpInput): Promise<IcpResult<IcpRow>> {
  const parsed = createIcpSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path.includes("productId")) {
      return fail({ code: "PRODUCT_ID_INVALID", message: issue.message });
    }
    if (issue.path.includes("name")) {
      return fail({ code: "NAME_EMPTY", message: issue.message });
    }
    if (issue.path.includes("business_model")) {
      return fail({ code: "BUSINESS_MODEL_INVALID", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  const { productId, ...fields } = parsed.data;

  try {
    const db = getDb();

    // One-active-ICP-per-product guard
    const existing = await db
      .select({ id: icps.id })
      .from(icps)
      .where(and(eq(icps.product_id, productId), isNull(icps.archived_at)))
      .limit(1);

    if (existing.length > 0) {
      return fail({
        code: "ICP_ALREADY_EXISTS",
        message:
          "An active ICP already exists for this product. Archive the existing ICP before creating a new one.",
      });
    }

    const [row] = await db
      .insert(icps)
      .values({
        product_id: productId,
        name: fields.name,
        description: fields.description ?? null,
        industry: fields.industry ?? null,
        company_size: fields.company_size ?? null,
        geography: fields.geography ?? null,
        business_model: fields.business_model ?? null,
        pain_points: fields.pain_points ?? null,
        goals: fields.goals ?? null,
        buying_signals: fields.buying_signals ?? null,
        disqualifiers: fields.disqualifiers ?? null,
        notes: fields.notes ?? null,
      })
      .returning();

    return { ok: true, data: toIcpRow(row) };
  } catch (e) {
    // The partial unique index (UNIQUE(product_id) WHERE archived_at IS NULL)
    // is the database-level enforcement of the one-active-ICP invariant.
    // Catch unique violations here so concurrent inserts that race past the
    // pre-insert check still return the correct domain error.
    if (isUniqueViolation(e)) {
      return fail({
        code: "ICP_ALREADY_EXISTS",
        message:
          "An active ICP already exists for this product. Archive the existing ICP before creating a new one.",
      });
    }
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Retrieve an ICP by ID, scoped to a product.
 *
 * Returns ICP_NOT_FOUND if the ICP does not exist OR belongs to a different
 * product — callers cannot distinguish the two cases (oracle prevention).
 *
 * Returns both active and archived ICPs. Callers that need only active ICPs
 * should check `archived_at === null`.
 *
 * @param productId - The product this ICP must belong to.
 * @param icpId     - UUID of the ICP to retrieve.
 */
export async function getIcpById(
  productId: string,
  icpId: string,
): Promise<IcpResult<IcpRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const iid = uuidSchema.safeParse(icpId);
  if (!iid.success) {
    return fail({ code: "ICP_ID_INVALID", message: "icpId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(icps)
      .where(and(eq(icps.product_id, productId), eq(icps.id, icpId)))
      .limit(1);

    if (rows.length === 0) {
      return fail({ code: "ICP_NOT_FOUND", message: "ICP not found." });
    }
    return { ok: true, data: toIcpRow(rows[0]) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * List all ACTIVE (non-archived) ICPs for a product, ordered by name.
 *
 * At MVP this returns at most one ICP per product. The list pattern is
 * used rather than getSingleIcp() to remain compatible with future
 * multi-ICP expansion without an API change.
 *
 * @param productId - UUID of the product whose ICPs to list.
 */
export async function getIcpsForProduct(
  productId: string,
): Promise<IcpResult<IcpRow[]>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(icps)
      .where(and(eq(icps.product_id, productId), isNull(icps.archived_at)))
      .orderBy(icps.name);

    return { ok: true, data: rows.map(toIcpRow) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Update mutable fields on an active ICP.
 *
 * The operation is product-scoped: an icpId belonging to a different product
 * returns ICP_NOT_FOUND. Archived ICPs cannot be updated.
 *
 * At least one field must be provided (enforced by Zod).
 *
 * @param productId - The product this ICP must belong to.
 * @param icpId     - UUID of the ICP to update.
 * @param input     - Fields to update (all optional, at least one required).
 */
export async function updateIcp(
  productId: string,
  icpId: string,
  input: UpdateIcpInput,
): Promise<IcpResult<IcpRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const iid = uuidSchema.safeParse(icpId);
  if (!iid.success) {
    return fail({ code: "ICP_ID_INVALID", message: "icpId must be a valid UUID." });
  }

  const parsed = updateIcpSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.code === "custom") {
      return fail({ code: "NO_UPDATE_FIELDS", message: issue.message });
    }
    if (issue.path.includes("name")) {
      return fail({ code: "NAME_EMPTY", message: issue.message });
    }
    if (issue.path.includes("business_model")) {
      return fail({ code: "BUSINESS_MODEL_INVALID", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  try {
    const db = getDb();

    // Confirm ownership and active status before updating
    const existing = await db
      .select()
      .from(icps)
      .where(and(eq(icps.product_id, productId), eq(icps.id, icpId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "ICP_NOT_FOUND", message: "ICP not found." });
    }

    if (existing[0].archived_at !== null) {
      return fail({ code: "ICP_ALREADY_ARCHIVED", message: "Cannot update an archived ICP." });
    }

    const data = parsed.data;
    const now = new Date();

    // Build update patch — only include explicitly provided fields
    const patch: Record<string, unknown> = { updated_at: now };
    if (data.name !== undefined) patch.name = data.name;
    if ("description" in data) patch.description = data.description ?? null;
    if ("industry" in data) patch.industry = data.industry ?? null;
    if ("company_size" in data) patch.company_size = data.company_size ?? null;
    if ("geography" in data) patch.geography = data.geography ?? null;
    if ("business_model" in data) patch.business_model = data.business_model ?? null;
    if ("pain_points" in data) patch.pain_points = data.pain_points ?? null;
    if ("goals" in data) patch.goals = data.goals ?? null;
    if ("buying_signals" in data) patch.buying_signals = data.buying_signals ?? null;
    if ("disqualifiers" in data) patch.disqualifiers = data.disqualifiers ?? null;
    if ("notes" in data) patch.notes = data.notes ?? null;

    const [updated] = await db
      .update(icps)
      .set(patch)
      .where(and(eq(icps.product_id, productId), eq(icps.id, icpId)))
      .returning();

    return { ok: true, data: toIcpRow(updated) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Archive an ICP within a product.
 *
 * Sets `archived_at` to the current timestamp. The ICP row remains in
 * the database. Archiving an already-archived ICP returns ICP_ALREADY_ARCHIVED.
 * The operation is product-scoped: an icpId belonging to a different product
 * returns ICP_NOT_FOUND.
 *
 * @param productId - The product this ICP must belong to.
 * @param icpId     - UUID of the ICP to archive.
 */
export async function archiveIcp(
  productId: string,
  icpId: string,
): Promise<IcpResult<IcpRow>> {
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }
  const iid = uuidSchema.safeParse(icpId);
  if (!iid.success) {
    return fail({ code: "ICP_ID_INVALID", message: "icpId must be a valid UUID." });
  }

  try {
    const db = getDb();

    const existing = await db
      .select()
      .from(icps)
      .where(and(eq(icps.product_id, productId), eq(icps.id, icpId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "ICP_NOT_FOUND", message: "ICP not found." });
    }

    if (existing[0].archived_at !== null) {
      return fail({ code: "ICP_ALREADY_ARCHIVED", message: "ICP is already archived." });
    }

    const now = new Date();
    const [archived] = await db
      .update(icps)
      .set({ archived_at: now, updated_at: now })
      .where(and(eq(icps.product_id, productId), eq(icps.id, icpId)))
      .returning();

    return { ok: true, data: toIcpRow(archived) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}
