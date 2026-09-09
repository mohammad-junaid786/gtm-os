/**
 * Authentication seam — server-side only.
 *
 * This module is the single integration point for obtaining the current
 * authenticated user's principal ID (userId) in a server context.
 *
 * CURRENT STATE (authentication not yet implemented):
 *   `getCurrentUserId()` returns `null`.
 *   Any route that calls it will receive `null` and must call `notFound()`
 *   or redirect to a login page rather than bypassing authorization.
 *
 * FUTURE INTEGRATION:
 *   When an auth provider is chosen (e.g. Clerk, Auth.js, Better Auth),
 *   replace the body of `getCurrentUserId` with the provider's session
 *   lookup. The return type is `Promise<string | null>` — a UUID string
 *   for authenticated users, `null` for unauthenticated users.
 *
 *   Example (Clerk):
 *     import { auth } from "@clerk/nextjs/server";
 *     export async function getCurrentUserId(): Promise<string | null> {
 *       const { userId } = await auth();
 *       return userId ?? null;
 *     }
 *
 * IMPORTANT:
 *   This function must NEVER return a fake, hardcoded, or default userId.
 *   Doing so would bypass the membership-aware workspace resolver and grant
 *   unauthorized access to product routes.
 */
import "server-only";

/**
 * Returns the current authenticated user's principal ID, or `null` if
 * the user is not authenticated or authentication is not yet configured.
 *
 * Callers must handle the `null` case explicitly (e.g. via `notFound()`).
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Authentication is not yet implemented.
  // Return null so that all product routes fail cleanly via notFound().
  return null;
}
