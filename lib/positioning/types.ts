/**
 * Domain types for Positioning operations.
 *
 * No server-only imports — these may be used in client components
 * (e.g. for Server Action return types or form state types).
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

/**
 * A positioning row as returned from the database.
 *
 * `archived_at` is null for active positioning, non-null for archived.
 * Positioning records are never hard-deleted — see architecture.md Stage 12.
 */
export interface PositioningRow {
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
}

// ---------------------------------------------------------------------------
// Input schemas (used by service validation)
// ---------------------------------------------------------------------------

const optionalText = (maxLen: number) =>
  z.string().max(maxLen).nullable().optional();

const optionalTextArray = (elemMaxLen: number) =>
  z
    .array(z.string().min(1).max(elemMaxLen))
    .nullable()
    .optional();

export const createPositioningSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  positioning_statement: z.string().max(2000).optional(),
  target_customer: z.string().max(2000).optional(),
  customer_problem: z.string().max(2000).optional(),
  unique_value: z.string().max(2000).optional(),
  alternatives: optionalTextArray(500),
  proof_points: optionalTextArray(500),
  notes: z.string().max(10000).optional(),
});

export type CreatePositioningInput = z.infer<typeof createPositioningSchema>;

export const updatePositioningSchema = z
  .object({
    positioning_statement: optionalText(2000),
    target_customer: optionalText(2000),
    customer_problem: optionalText(2000),
    unique_value: optionalText(2000),
    alternatives: optionalTextArray(500),
    proof_points: optionalTextArray(500),
    notes: optionalText(10000),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided for update.",
  });

export type UpdatePositioningInput = z.infer<typeof updatePositioningSchema>;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Standard result wrapper used by the Positioning service. */
export type PositioningResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PositioningServiceError };

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the Positioning service can return.
 *
 * Callers must switch on `code` — do not pattern-match on `message`.
 */
export type PositioningServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "POSITIONING_ID_INVALID"; message: string }
  | { code: "POSITIONING_NOT_FOUND"; message: string }
  | { code: "POSITIONING_ALREADY_ARCHIVED"; message: string }
  | { code: "POSITIONING_ALREADY_EXISTS"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
