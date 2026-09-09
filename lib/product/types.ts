/**
 * Domain types for product operations.
 *
 * No server-only imports — these may be used in client components
 * (e.g. for Server Action return types or form state types).
 */

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

/**
 * A product row as returned from the database.
 *
 * `archived_at` is null for active products, non-null for archived products.
 * Products are never hard-deleted — see architecture.md Stage 3.
 */
export interface ProductRow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input for creating a product within a workspace.
 *
 * @property workspaceId - The workspace this product belongs to.
 * @property name        - Human-readable product name (1–255 characters).
 * @property slug        - Optional URL-safe slug. Derived from `name` when omitted.
 *                         Unique within the workspace, including archived products.
 */
export interface CreateProductInput {
  workspaceId: string;
  name: string;
  slug?: string;
}

/**
 * Fields that may be updated on an existing product.
 *
 * Only `name` and `slug` are mutable; lifecycle fields are managed
 * by dedicated operations (`archiveProduct`).
 * At least one field must be provided.
 */
export interface UpdateProductInput {
  name?: string;
  slug?: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Structured result: either success data or a typed error. */
export type ProductResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProductServiceError };

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the product service can return.
 *
 * Callers must switch on `code` — do not pattern-match on `message`.
 */
export type ProductServiceError =
  | { code: "WORKSPACE_ID_INVALID"; message: string }
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "SLUG_INVALID"; message: string; slug: string }
  | { code: "SLUG_CONFLICT"; message: string; slug: string }
  | { code: "PRODUCT_NOT_FOUND"; message: string }
  | { code: "PRODUCT_ALREADY_ARCHIVED"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
