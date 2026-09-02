/**
 * Public API surface of the workspace domain module.
 *
 * Service functions (server-only) are exported directly.
 * Types and slug utilities have no server-only restriction.
 */
export { createWorkspace, getWorkspaceBySlug, isSlugAvailable } from "./service";
export { normalizeSlug, isValidSlug, slugFromName } from "./slug";
export type {
  CreateWorkspaceInput,
  CreateWorkspaceResult,
  WorkspaceRow,
  WorkspaceMemberRow,
  WorkspaceResult,
  WorkspaceServiceError,
} from "./types";
