/**
 * Domain types for ICP (Ideal Customer Profile) operations.
 *
 * No server-only imports — these may be used in client components
 * (e.g. for Server Action return types or form state types).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BUSINESS_MODELS = ["b2b", "b2c", "b2b2c", "marketplace"] as const;
export type BusinessModel = (typeof BUSINESS_MODELS)[number];

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

/**
 * An ICP row as returned from the database.
 *
 * `archived_at` is null for active ICPs, non-null for archived ones.
 * ICPs are never hard-deleted — see architecture.md Stage 6.
 */
export interface IcpRow {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  geography: string | null;
  business_model: BusinessModel | null;
  pain_points: string[] | null;
  goals: string[] | null;
  buying_signals: string[] | null;
  disqualifiers: string[] | null;
  notes: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input for creating an ICP within a product.
 *
 * Only `productId` and `name` are required.
 * All structured fields are optional at creation time.
 *
 * Service enforces the one-ICP-per-product constraint before inserting.
 */
export interface CreateIcpInput {
  productId: string;
  name: string;
  description?: string;
  industry?: string;
  company_size?: string;
  geography?: string;
  business_model?: BusinessModel;
  pain_points?: string[];
  goals?: string[];
  buying_signals?: string[];
  disqualifiers?: string[];
  notes?: string;
}

/**
 * Fields that may be updated on an existing ICP.
 *
 * All fields are optional — at least one must be provided (enforced by Zod).
 * Lifecycle fields (archived_at) are managed by archiveIcp().
 */
export interface UpdateIcpInput {
  name?: string;
  description?: string;
  industry?: string;
  company_size?: string;
  geography?: string;
  business_model?: BusinessModel | null;
  pain_points?: string[];
  goals?: string[];
  buying_signals?: string[];
  disqualifiers?: string[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Standard result wrapper used by the ICP service. */
export type IcpResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IcpServiceError };

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the ICP service can return.
 *
 * Callers must switch on `code` — do not pattern-match on `message`.
 */
export type IcpServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "ICP_ID_INVALID"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "BUSINESS_MODEL_INVALID"; message: string }
  | { code: "ICP_NOT_FOUND"; message: string }
  | { code: "ICP_ALREADY_ARCHIVED"; message: string }
  | { code: "ICP_ALREADY_EXISTS"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
