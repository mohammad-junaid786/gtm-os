/**
 * Domain types for Persona operations.
 *
 * No server-only imports — these may be used in client components
 * (e.g. for Server Action return types or form state types).
 */

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

/**
 * A Persona row as returned from the database.
 *
 * `archived_at` is null for active Personas, non-null for archived ones.
 * Personas are never hard-deleted — see architecture.md Stage 7.
 */
export interface PersonaRow {
  id: string;
  icp_id: string;
  name: string;
  role: string;
  goals: string[] | null;
  pain_points: string[] | null;
  motivations: string[] | null;
  objections: string[] | null;
  decision_criteria: string[] | null;
  preferred_channels: string[] | null;
  messaging_angles: string[] | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input for creating a Persona.
 *
 * `icpId` and `name`, `role` are required.
 * All structured fields are optional at creation time.
 */
export interface CreatePersonaInput {
  icpId: string;
  name: string;
  role: string;
  goals?: string[];
  pain_points?: string[];
  motivations?: string[];
  objections?: string[];
  decision_criteria?: string[];
  preferred_channels?: string[];
  messaging_angles?: string[];
}

/**
 * Fields that may be updated on an existing Persona.
 *
 * All fields are optional — at least one must be provided (enforced by Zod).
 * Lifecycle fields (archived_at) are managed by archivePersona().
 */
export interface UpdatePersonaInput {
  name?: string;
  role?: string;
  goals?: string[];
  pain_points?: string[];
  motivations?: string[];
  objections?: string[];
  decision_criteria?: string[];
  preferred_channels?: string[];
  messaging_angles?: string[];
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Standard result wrapper used by the Persona service. */
export type PersonaResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PersonaServiceError };

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all errors the Persona service can return.
 *
 * Callers must switch on `code` — do not pattern-match on `message`.
 */
export type PersonaServiceError =
  | { code: "PRODUCT_ID_INVALID"; message: string }
  | { code: "ICP_ID_INVALID"; message: string }
  | { code: "PERSONA_ID_INVALID"; message: string }
  | { code: "NAME_EMPTY"; message: string }
  | { code: "ROLE_EMPTY"; message: string }
  | { code: "PERSONA_NOT_FOUND"; message: string }
  | { code: "ICP_NOT_FOUND_OR_ARCHIVED"; message: string }
  | { code: "PERSONA_ALREADY_ARCHIVED"; message: string }
  | { code: "NO_UPDATE_FIELDS"; message: string }
  | { code: "UNKNOWN"; message: string; cause?: unknown };
