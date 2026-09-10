/**
 * Route resolver — server-side only.
 *
 * Implements the three-stage product route resolution chain:
 *
 *   userId + workspaceSlug + productSlug
 *   → resolveWorkspaceForUser    (membership-aware workspace lookup)
 *   → getProductBySlug           (workspace-scoped slug lookup)
 *   → resolveProductContext      (orchestrator; rejects archived products)
 *
 * Security design:
 *
 *   - NOT_FOUND is returned for ALL negative outcomes (missing workspace,
 *     non-member, missing product, archived product). Callers cannot
 *     distinguish the failure reason — this prevents oracle attacks.
 *   - Products are never looked up globally. The workspace_id scope is
 *     established before any product query is issued.
 *   - userId must be validated as a UUID before any DB access.
 *   - Workspace slug is normalised using the shared slug utilities before
 *     any DB access — malformed slugs are rejected immediately.
 *   - No fake/default user is ever substituted. See current-user.ts.
 *
 * Authentication is deferred. See lib/routing/current-user.ts for the
 * future-auth integration seam.
 */
import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, products } from "@/db/schema";
import { normalizeSlug, isValidSlug } from "@/lib/workspace/slug";
import type { WorkspaceRow } from "@/lib/workspace/types";
import type { ProductRow } from "@/lib/product/types";
import type {
  ProductContext,
  RouteResolutionError,
  RouteResolutionResult,
} from "./types";

// ---------------------------------------------------------------------------
// Shared validation schema
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function notFound(): RouteResolutionResult<never> {
  return {
    ok: false,
    error: { code: "NOT_FOUND", message: "Not found." },
  };
}

function routeErr(error: RouteResolutionError): RouteResolutionResult<never> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// 1. Membership-aware workspace resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a workspace by slug AND verify that `userId` is a member.
 *
 * This is the security boundary that replaces `getWorkspaceBySlug`.
 * The bare slug lookup (`getWorkspaceBySlug`) is intentionally NOT
 * sufficient because it does not check membership.
 *
 * The query joins `workspace_members` and `workspaces` so that only one
 * round-trip is made. If either the workspace does not exist OR the user
 * is not a member, `NOT_FOUND` is returned — no distinction is made
 * between these two cases.
 *
 * @param userId        - Opaque principal UUID (validated before DB access).
 * @param workspaceSlug - URL slug to look up (normalised before DB access).
 */
export async function resolveWorkspaceForUser(
  userId: string,
  workspaceSlug: string,
): Promise<RouteResolutionResult<WorkspaceRow>> {
  // Validate userId
  const uid = uuidSchema.safeParse(userId);
  if (!uid.success) {
    return routeErr({ code: "USER_ID_INVALID", message: "userId must be a valid UUID." });
  }

  // Normalize and validate workspace slug
  const normalized = normalizeSlug(workspaceSlug);
  if (!normalized || !isValidSlug(normalized)) {
    return routeErr({ code: "WORKSPACE_SLUG_INVALID", message: "workspaceSlug is not valid." });
  }

  try {
    const db = getDb();

    // Single JOIN: workspace_members ⟶ workspaces.
    // Only returns a row when BOTH the workspace exists AND the user is a member.
    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        created_at: workspaces.created_at,
        updated_at: workspaces.updated_at,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
      .where(
        and(
          eq(workspaceMembers.user_id, userId),
          eq(workspaces.slug, normalized),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      // Deliberately generic — do not reveal whether the workspace
      // exists but the user is not a member.
      return notFound();
    }

    return { ok: true, data: rows[0] };
  } catch (e) {
    return routeErr({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

// ---------------------------------------------------------------------------
// 2. Workspace-scoped product lookup by slug
// ---------------------------------------------------------------------------

/**
 * Look up a product by its slug within a specific workspace.
 *
 * Requires `workspaceId` — product slugs are NEVER resolved globally.
 * Returns both active and archived products; the caller is responsible
 * for filtering archived products based on context (e.g. normal routing
 * rejects archived products; an admin view might not).
 *
 * @param workspaceId   - UUID of the workspace already resolved for the user.
 * @param productSlug   - Raw slug from the URL (normalised before DB access).
 */
export async function getProductBySlug(
  workspaceId: string,
  productSlug: string,
): Promise<RouteResolutionResult<ProductRow>> {
  // Validate workspaceId
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) {
    return routeErr({ code: "UNKNOWN", message: "workspaceId must be a valid UUID." });
  }

  // Normalise and validate product slug
  const normalized = normalizeSlug(productSlug);
  if (!normalized || !isValidSlug(normalized)) {
    return routeErr({ code: "PRODUCT_SLUG_INVALID", message: "productSlug is not valid." });
  }

  try {
    const db = getDb();

    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.workspace_id, workspaceId),
          eq(products.slug, normalized),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return notFound();
    }

    const row = rows[0];
    return {
      ok: true,
      data: {
        id: row.id,
        workspace_id: row.workspace_id,
        name: row.name,
        slug: row.slug,
        archived_at: row.archived_at ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    };
  } catch (e) {
    return routeErr({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

// ---------------------------------------------------------------------------
// 3. Product context resolver (orchestrator)
// ---------------------------------------------------------------------------

export interface ResolveProductContextInput {
  userId: string;
  workspaceSlug: string;
  productSlug: string;
}

/**
 * Resolve the full product route context from URL parameters and a userId.
 *
 * Execution order:
 *   1. Validate userId (rejected before any DB access).
 *   2. Resolve workspace through membership-aware lookup (no bare slug lookup).
 *   3. Resolve product by slug scoped to that workspace.
 *   4. Reject archived products — they are not routable through this path.
 *   5. Return { workspace, product } context.
 *
 * All negative outcomes (no membership, no product, archived product)
 * return NOT_FOUND so that callers cannot distinguish failure reasons.
 *
 * @param input - { userId, workspaceSlug, productSlug }
 */
export async function resolveProductContext(
  input: ResolveProductContextInput,
): Promise<RouteResolutionResult<ProductContext>> {
  const { userId, workspaceSlug, productSlug } = input;

  // Step 1 + 2: membership-aware workspace resolution
  const workspaceResult = await resolveWorkspaceForUser(userId, workspaceSlug);
  if (!workspaceResult.ok) {
    // Propagate validation errors (USER_ID_INVALID, WORKSPACE_SLUG_INVALID)
    // and convert NOT_FOUND/UNKNOWN to NOT_FOUND for the caller.
    if (
      workspaceResult.error.code === "USER_ID_INVALID" ||
      workspaceResult.error.code === "WORKSPACE_SLUG_INVALID"
    ) {
      return workspaceResult;
    }
    return notFound();
  }

  const workspace = workspaceResult.data;

  // Step 3: product lookup scoped to the resolved workspace
  const productResult = await getProductBySlug(workspace.id, productSlug);
  if (!productResult.ok) {
    // Treat PRODUCT_SLUG_INVALID and UNKNOWN as generic not-found for routing.
    return notFound();
  }

  const product = productResult.data;

  // Step 4: reject archived products — they are not routable via normal routes
  if (product.archived_at !== null) {
    // Return NOT_FOUND — do not reveal the product exists but is archived.
    return notFound();
  }

  // Step 5: return resolved context
  return { ok: true, data: { workspace, product } };
}

// ---------------------------------------------------------------------------
// 4. Product-by-ID resolver for Server Actions
// ---------------------------------------------------------------------------

/**
 * Resolve an active product by its UUID, verifying workspace membership.
 *
 * Used by Server Actions which receive a productId from the client and need
 * to establish their own authorization boundary independently of the page
 * layout.
 *
 * Security design:
 *   - Validates userId before any DB access.
 *   - Validates productId before any DB access.
 *   - Joins product → workspace → workspace_members in a single query so that
 *     all of the following are checked atomically:
 *       (a) the product exists
 *       (b) the product belongs to a workspace the user is a member of
 *       (c) the product is active (archived_at IS NULL)
 *   - All negative outcomes return NOT_FOUND — callers cannot distinguish
 *     between "product does not exist", "user is not a member", or
 *     "product is archived". This prevents oracle attacks.
 *
 * @param userId    - Authenticated principal UUID. Must NOT be fake/hardcoded.
 * @param productId - Product UUID received from the client. Untrusted until resolved.
 */
export async function resolveProductForUser(
  userId: string,
  productId: string,
): Promise<RouteResolutionResult<{ product: ProductRow; workspaceId: string }>> {
  // Validate userId
  const uid = uuidSchema.safeParse(userId);
  if (!uid.success) {
    return routeErr({ code: "USER_ID_INVALID", message: "userId must be a valid UUID." });
  }

  // Validate productId
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    // Return NOT_FOUND — callers should not learn that the productId was malformed
    return notFound();
  }

  try {
    const db = getDb();

    // Single query: product → workspace → membership.
    // Returns a row only when ALL of:
    //   - product exists with the given id
    //   - product.workspace_id workspace exists
    //   - user is a member of that workspace
    //   - product is active (archived_at IS NULL)
    const rows = await db
      .select({
        product_id: products.id,
        product_name: products.name,
        product_slug: products.slug,
        product_archived_at: products.archived_at,
        product_created_at: products.created_at,
        product_updated_at: products.updated_at,
        workspace_id: workspaces.id,
      })
      .from(products)
      .innerJoin(workspaces, eq(products.workspace_id, workspaces.id))
      .innerJoin(workspaceMembers, eq(workspaceMembers.workspace_id, workspaces.id))
      .where(
        and(
          eq(products.id, productId),
          eq(workspaceMembers.user_id, userId),
          // Only active products are accessible via normal Server Action paths
          // (same invariant as resolveProductContext)
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return notFound();
    }

    const row = rows[0];

    // Reject archived products
    if (row.product_archived_at !== null) {
      return notFound();
    }

    const product: ProductRow = {
      id: row.product_id,
      workspace_id: row.workspace_id,
      name: row.product_name,
      slug: row.product_slug,
      archived_at: row.product_archived_at,
      created_at: row.product_created_at,
      updated_at: row.product_updated_at,
    };

    return { ok: true, data: { product, workspaceId: row.workspace_id } };
  } catch (e) {
    return routeErr({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}
