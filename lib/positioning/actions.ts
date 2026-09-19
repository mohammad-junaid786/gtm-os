"use server";

/**
 * Positioning Server Actions — Next.js Server Actions for Positioning mutations.
 *
 * Authorization model:
 *   Server Actions are independently callable server endpoints. They MUST
 *   establish their own authorization boundary and cannot rely on the
 *   product layout having already verified access.
 *
 *   Every action:
 *     1. Calls authorizeProductAction(clientProductId) to:
 *          a. Obtain the authenticated principal.
 *          b. If null → returns NOT_AUTHORIZED immediately (no DB access).
 *          c. Verify workspace membership and active product status.
 *     2. Only if authorization succeeds → calls the Positioning service with
 *        the server-verified productId.
 *
 *   The client-supplied productId is NEVER trusted as authorization. It is
 *   treated as input that must be verified server-side before any Positioning
 *   database access.
 *
 * Server/client boundary:
 *   - These functions run on the server ("use server").
 *   - They return serializable values only (no DB objects, no server-only types).
 *   - Client components import from this file but cannot access the DB directly.
 */
import { authorizeProductAction } from "@/lib/routing/authorize-action";
import {
  createPositioning,
  getPositioningForProduct,
  updatePositioning,
  archivePositioning,
} from "@/lib/positioning/service";
import type {
  CreatePositioningInput,
  UpdatePositioningInput,
  PositioningResult,
  PositioningRow,
} from "@/lib/positioning/types";

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Server Action: load the active positioning for a product.
 *
 * Requires authentication + workspace membership. Returns null if no active
 * positioning exists. Returns a generic error if not authorized.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 */
export async function loadPositioningAction(
  clientProductId: string,
): Promise<PositioningResult<PositioningRow | null>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return getPositioningForProduct(auth.productId);
}

/**
 * Server Action: create a new positioning record for a product.
 *
 * Requires authentication + workspace membership.
 * The productId inside `input` is verified server-side before use.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 * @param input           - Optional content fields.
 */
export async function createPositioningAction(
  clientProductId: string,
  input: CreatePositioningInput,
): Promise<PositioningResult<PositioningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  // Replace client-supplied productId with server-verified productId
  return createPositioning({ ...input, productId: auth.productId });
}

/**
 * Server Action: update an existing positioning record.
 *
 * Requires authentication + workspace membership verified via productId.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 * @param positioningId   - UUID of the positioning record to update.
 * @param input           - Fields to update.
 */
export async function updatePositioningAction(
  clientProductId: string,
  positioningId: string,
  input: UpdatePositioningInput,
): Promise<PositioningResult<PositioningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return updatePositioning(auth.productId, positioningId, input);
}

/**
 * Server Action: archive a positioning record.
 *
 * Requires authentication + workspace membership verified via productId.
 *
 * @param clientProductId - Product UUID from the client. Verified server-side.
 * @param positioningId   - UUID of the positioning record to archive.
 */
export async function archivePositioningAction(
  clientProductId: string,
  positioningId: string,
): Promise<PositioningResult<PositioningRow>> {
  const auth = await authorizeProductAction(clientProductId);
  if (!auth.ok) return auth.result;

  return archivePositioning(auth.productId, positioningId);
}
