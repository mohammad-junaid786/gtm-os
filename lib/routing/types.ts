/**
 * Domain types for Stage 4 route resolution.
 *
 * These types carry fully-resolved domain objects through the route layer.
 * They are NOT server-only — the types may be used in layouts and page
 * components that receive them as props from server-side resolution.
 *
 * Authentication is deferred. The `userId` supplied to resolvers is an
 * opaque UUID principal — currently provided explicitly by the call site.
 * Future: a getCurrentUserId() auth seam will inject it automatically.
 */

import type { WorkspaceRow } from "@/lib/workspace/types";
import type { ProductRow } from "@/lib/product/types";

// ---------------------------------------------------------------------------
// Resolved route context
// ---------------------------------------------------------------------------

/**
 * The fully-resolved application context for a product route.
 *
 * Both fields carry canonical database/domain objects — never raw URL
 * values. The product is guaranteed to be active (archived_at IS NULL).
 *
 * Produced by `resolveProductContext` and consumed by page components.
 */
export interface ProductContext {
  workspace: WorkspaceRow;
  product: ProductRow;
}

// ---------------------------------------------------------------------------
// Resolution errors
// ---------------------------------------------------------------------------

/**
 * Discriminated union of errors the route resolver can return.
 *
 * `NOT_FOUND` is deliberately generic: it does not distinguish between
 *   - workspace does not exist
 *   - workspace exists but user is not a member
 *   - product does not exist in this workspace
 *   - product is archived
 *
 * This prevents callers from determining whether any particular workspace
 * or product ID/slug exists when the user lacks access (oracle attack).
 */
export type RouteResolutionError =
  | { code: "USER_ID_INVALID"; message: string }
  | { code: "WORKSPACE_SLUG_INVALID"; message: string }
  | { code: "PRODUCT_SLUG_INVALID"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };

/** Standard result wrapper used by the route resolver. */
export type RouteResolutionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RouteResolutionError };
