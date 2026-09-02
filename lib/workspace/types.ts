/**
 * Domain types for workspace operations.
 *
 * These types are shared between the service layer and any callers
 * (Server Actions, API routes, tests). They do NOT import from
 * server-only modules so they can be used anywhere.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input required to create a new workspace and its initial owner membership.
 *
 * @property name     - Human-readable workspace name (1–255 characters).
 * @property slug     - Optional URL-safe slug. Derived from `name` when omitted.
 * @property ownerId  - Opaque UUID identifying the principal who becomes owner.
 *                      No FK exists yet — authentication is deferred to Stage 4.
 */
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  ownerId: string;
}

// ---------------------------------------------------------------------------
// Output / result types
// ---------------------------------------------------------------------------

/** The workspace row as returned from the database after creation. */
export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

/** The membership row created for the initial owner. */
export interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: Date;
  updated_at: Date;
}

/** The combined result returned from `createWorkspace`. */
export interface CreateWorkspaceResult {
  workspace: WorkspaceRow;
  ownerMembership: WorkspaceMemberRow;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/** Discriminated union of structured errors the service can return. */
export type WorkspaceServiceError =
  | { code: "SLUG_CONFLICT"; message: string; slug: string }
  | { code: "SLUG_INVALID"; message: string; slug: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "OWNER_ID_INVALID"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };

/** Result type: either a success value or a structured error. */
export type WorkspaceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WorkspaceServiceError };
