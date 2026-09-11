import "server-only";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveProductForUser } from "@/lib/routing/resolver";

/**
 * Obtain an authenticated userId and verify that the user has access to the
 * given productId.
 *
 * Returns `{ ok: true, productId }` with the server-verified productId on
 * success, or `{ ok: false, result }` with a generic "UNKNOWN" / "Not authorized."
 * error compatible with most service result types.
 *
 * The returned productId is the canonical, server-verified value — callers
 * should use THIS value rather than the client-supplied one when calling
 * service functions.
 */
export async function authorizeProductAction(
  clientProductId: string,
): Promise<
  | { ok: true; productId: string }
  | { ok: false; result: { ok: false; error: { code: "UNKNOWN"; message: string } } }
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
