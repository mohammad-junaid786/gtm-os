/**
 * Domain types for Competitors operations.
 *
 * No server-only imports — these may be used in client components
 * (e.g. for Server Action return types or form state types).
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

/**
 * A competitor row as returned from the database.
 *
 * `name_normalized` is maintained internally by the service and is the basis
 * for the unique constraint. It should generally not be displayed in the UI.
 *
 * `archived_at` is null for active competitors, non-null for archived.
 * Competitors are never hard-deleted.
 */
export interface CompetitorRow {
  id: string;
  product_id: string;
  name: string;
  name_normalized: string;
  website: string | null;
  category: string | null;
  description: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  differentiators: string[] | null;
  pricing_notes: string | null;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Input schemas (used by service validation)
// ---------------------------------------------------------------------------

const websiteSchema = z
  .string()
  .url("Website must be a valid URL.")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    { message: "Website must use http or https." },
  )
  .nullable()
  .optional();

const optionalText = (maxLen: number) =>
  z.string().max(maxLen).nullable().optional();

const optionalTextArray = (elemMaxLen: number) =>
  z
    .array(z.string().min(1).max(elemMaxLen))
    .nullable()
    .optional();

export const createCompetitorSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  name: z.string().min(1).max(255),
  website: websiteSchema,
  category: optionalText(255),
  description: optionalText(2000),
  strengths: optionalTextArray(500),
  weaknesses: optionalTextArray(500),
  differentiators: optionalTextArray(500),
  pricing_notes: optionalText(2000),
  notes: optionalText(10000),
});

export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>;

export const updateCompetitorSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    website: websiteSchema,
    category: optionalText(255),
    description: optionalText(2000),
    strengths: optionalTextArray(500),
    weaknesses: optionalTextArray(500),
    differentiators: optionalTextArray(500),
    pricing_notes: optionalText(2000),
    notes: optionalText(10000),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided for update.",
  });

export type UpdateCompetitorInput = z.infer<typeof updateCompetitorSchema>;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Standard result wrapper used by the Competitors service. */
export type CompetitorResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CompetitorServiceError };

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the Competitors service can return.
 *
 * Callers must switch on `code` — do not pattern-match on `message`.
 */
export type CompetitorServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "COMPETITOR_ID_INVALID"; message: string }
  | { code: "COMPETITOR_NOT_FOUND"; message: string }
  | { code: "COMPETITOR_ALREADY_ARCHIVED"; message: string }
  | { code: "COMPETITOR_ALREADY_EXISTS"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "WEBSITE_INVALID"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
