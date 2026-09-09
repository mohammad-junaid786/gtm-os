/**
 * Public API surface of the routing domain module.
 *
 * Resolver functions are server-only (via resolver.ts → import "server-only").
 * Types have no server-only restriction.
 */
export {
  resolveWorkspaceForUser,
  getProductBySlug,
  resolveProductContext,
} from "./resolver";

export type { ResolveProductContextInput } from "./resolver";

export { getCurrentUserId } from "./current-user";

export type {
  ProductContext,
  RouteResolutionError,
  RouteResolutionResult,
} from "./types";
