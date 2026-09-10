"use server";

/**
 * ICP Server Actions — Next.js Server Actions for ICP mutations.
 *
 * Authorization model:
 *   Server Actions are independently callable server endpoints. They MUST
 *   establish their own authorization boundary and cannot rely on the
 *   product layout having already verified access.
 *
 *   Every action:
 *     1. Calls getCurrentUserId() to obtain the authenticated principal.
 *     2. If null → returns NOT_AUTHORIZED immediately (no DB access).
 *     3. Calls resolveProductForUser(userId, productId) to verify:
 *          - the product exists
 *          - the user is a workspace member of that product's workspace
 *          - the product is active (not archived)
 *     4. Only if resolution succeeds → calls the ICP service with the
 *        server-verified productId.
 *
 *   The client-supplied productId is NEVER trusted as authorization. It is
 *   treated as input that must be verified server-side before any ICP
 *   database access.
 *
 * Current state:
 *   getCurrentUserId() returns null (auth not yet implemented). All actions
 *   therefore return NOT_AUTHORIZED. This is correct — the ICP module is not
 *   usable without authentication, and no ICP data is accessible.
 *
 * Server/client boundary:
 *   - These functions run on the server ("use server").
 *   - They return serializable values only (no DB objects, no server-only types).
 *   - Client components import from this file but cannot access the DB directly.
 */
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveProductForUser } from "@/lib/routing/resolver";
import { createIcp, updateIcp, archiveIcp, getIcpsForProduct } from "@/lib/icp/service";
import type { CreateIcpInput, UpdateIcpInput, IcpResult, IcpRow } from "@/lib/icp/types";

// ---------------------------------------------------------------------------
// Shared authorization helper
// ---------------------------------------------------------------------------

/**
 * Obtain an authenticated userId and verify that the user has access to the
 * given productId.
 *
 * Returns `{ ok: true, productId }` with the server-verified productId on
 * success, or `{ ok: false, result }` with a typed IcpResult error to return
 * directly to the caller.
 *
 * The returned productId is the canonical, server-verified value — callers
 * should use THIS value rather than the client-supplied one when calling
 * the ICP service.
 */
async function authorizeProductAccess(
  clientProductId: string,
): Promise<
  | { ok: true; productId: string }
  | { ok: false; result: IcpResult<never> }
> {
  // Step 1: Obtain authenticated user
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      ok: false,
      result: {
        ok: false,
        error: { code: "UNKNOWN", message: "Not authorized." },
      },
    };
  }

  // Step 2: Verify the user has access to this product (membership check)
  const resolution = await resolveProductForUser(userId, clientProductId);
  if (!resolution.ok) {
    // All failure modes (invalid productId, not a member, archived) → generic error
    return {
      ok: false,
      result: {
        ok: false,
        error: { code: "UNKNOWN", message: "Not authorized." },
      },
    };
  }

  // Return the server-verified productId
  return { ok: true, productId: resolution.data.product.id };
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Server Action: load the active ICP for a product.
 *
 * Requires authentication + workspace membership. Returns null if no active
 * ICP exists. Returns a generic error if not authorized.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 */
export async function loadIcpAction(
  clientProductId: string,
): Promise<IcpResult<IcpRow | null>> {
  const auth = await authorizeProductAccess(clientProductId);
  if (!auth.ok) return auth.result;

  const result = await getIcpsForProduct(auth.productId);
  if (!result.ok) return result;
  return { ok: true, data: result.data[0] ?? null };
}

/**
 * Server Action: create a new ICP for a product.
 *
 * Requires authentication + workspace membership.
 * The productId inside `input` is verified server-side before use.
 *
 * @param input - productId (client-supplied, verified) + name + optional fields.
 */
export async function createIcpAction(
  input: CreateIcpInput,
): Promise<IcpResult<IcpRow>> {
  const auth = await authorizeProductAccess(input.productId);
  if (!auth.ok) return auth.result;

  // Replace client-supplied productId with server-verified productId
  return createIcp({ ...input, productId: auth.productId });
}

/**
 * Server Action: update an existing ICP.
 *
 * Requires authentication + workspace membership verified via productId.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 * @param icpId           - UUID of the ICP to update.
 * @param input           - Fields to update.
 */
export async function updateIcpAction(
  clientProductId: string,
  icpId: string,
  input: UpdateIcpInput,
): Promise<IcpResult<IcpRow>> {
  const auth = await authorizeProductAccess(clientProductId);
  if (!auth.ok) return auth.result;

  return updateIcp(auth.productId, icpId, input);
}

/**
 * Server Action: archive an ICP.
 *
 * Requires authentication + workspace membership verified via productId.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 * @param icpId           - UUID of the ICP to archive.
 */
export async function archiveIcpAction(
  clientProductId: string,
  icpId: string,
): Promise<IcpResult<IcpRow>> {
  const auth = await authorizeProductAccess(clientProductId);
  if (!auth.ok) return auth.result;

  return archiveIcp(auth.productId, icpId);
}
