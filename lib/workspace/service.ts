/**
 * Workspace service — server-side only.
 *
 * Contains domain logic for workspace creation and its associated
 * owner membership. All database access goes through `getDb()`.
 *
 * Design decisions (from docs/architecture.md):
 * - workspace.slug is globally unique; conflicts surface as SLUG_CONFLICT.
 * - The owner membership row is created atomically in the same transaction
 *   as the workspace row so the database is never in an inconsistent state.
 * - user_id is an opaque UUID with no FK — no users table yet.
 * - Authentication is deferred; callers are responsible for providing a
 *   valid ownerId (future auth integration will inject this).
 * - Exactly one owner per workspace is enforced by the partial unique index;
 *   the service never needs to check this in application code.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workspaces, workspaceMembers } from "@/db/schema";
import { slugFromName, isValidSlug, normalizeSlug } from "./slug";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceResult,
  WorkspaceResult,
  WorkspaceServiceError,
} from "./types";

// ---------------------------------------------------------------------------
// Input validation schema
// ---------------------------------------------------------------------------

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name cannot be empty").max(255),
  slug: z.string().optional(),
  ownerId: z.string().uuid("ownerId must be a valid UUID"),
});

// ---------------------------------------------------------------------------
// PostgreSQL unique violation error code
// ---------------------------------------------------------------------------

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): err is { code: string; constraint?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new workspace and its initial owner membership in a single
 * database transaction.
 *
 * Slug resolution order:
 * 1. If `input.slug` is provided: validate it, then use as-is.
 * 2. If `input.slug` is omitted: derive from `input.name`.
 * In both cases the slug is normalised (lowercased, hyphens, truncated).
 *
 * Returns a `WorkspaceResult` — callers must check `.ok` before using `.data`.
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<WorkspaceResult<CreateWorkspaceResult>> {
  // --- Validate input -------------------------------------------------------
  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    if (firstIssue.path.includes("name")) {
      return err({ code: "NAME_EMPTY", message: firstIssue.message });
    }
    if (firstIssue.path.includes("ownerId")) {
      return err({ code: "OWNER_ID_INVALID", message: firstIssue.message });
    }
    return err({ code: "UNKNOWN", message: firstIssue.message });
  }

  const { name, ownerId } = parsed.data;

  // --- Resolve slug ---------------------------------------------------------
  let slug: string;
  if (parsed.data.slug !== undefined) {
    // Caller provided an explicit slug — normalize it first
    const normalized = normalizeSlug(parsed.data.slug);
    if (!normalized) {
      return err({
        code: "SLUG_INVALID",
        message: `The provided slug "${parsed.data.slug}" produces an empty value after normalization.`,
        slug: parsed.data.slug,
      });
    }
    if (!isValidSlug(normalized)) {
      return err({
        code: "SLUG_INVALID",
        message: `Slug "${normalized}" is not a valid workspace slug. Use lowercase letters, numbers, and hyphens only.`,
        slug: normalized,
      });
    }
    slug = normalized;
  } else {
    // Derive from name
    try {
      slug = slugFromName(name);
    } catch (e) {
      return err({
        code: "SLUG_INVALID",
        message:
          e instanceof Error
            ? e.message
            : `Cannot derive a slug from workspace name "${name}".`,
        slug: "",
      });
    }
  }

  // --- Persist in a transaction --------------------------------------------
  const db = getDb();

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert workspace
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name, slug })
        .returning();

      // 2. Insert owner membership
      const [ownerMembership] = await tx
        .insert(workspaceMembers)
        .values({
          workspace_id: workspace.id,
          user_id: ownerId,
          role: "owner",
        })
        .returning();

      return { workspace, ownerMembership };
    });

    return {
      ok: true,
      data: {
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
          created_at: result.workspace.created_at,
          updated_at: result.workspace.updated_at,
        },
        ownerMembership: {
          id: result.ownerMembership.id,
          workspace_id: result.ownerMembership.workspace_id,
          user_id: result.ownerMembership.user_id,
          role: result.ownerMembership.role as "owner" | "member",
          created_at: result.ownerMembership.created_at,
          updated_at: result.ownerMembership.updated_at,
        },
      },
    };
  } catch (e) {
    if (isUniqueViolation(e)) {
      // The only unique constraint that can fire here on the workspaces table
      // is workspaces_slug_unique. The workspace_members partial unique index
      // (one owner per workspace) cannot fire because we just created the
      // workspace — no prior owner can exist.
      return err({
        code: "SLUG_CONFLICT",
        message: `A workspace with slug "${slug}" already exists. Choose a different name or provide a unique slug.`,
        slug,
      });
    }
    return err({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Look up a workspace by its slug.
 * Returns `null` if no workspace with that slug exists.
 */
export async function getWorkspaceBySlug(slug: string): Promise<
  | {
      id: string;
      name: string;
      slug: string;
      created_at: Date;
      updated_at: Date;
    }
  | null
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Check whether a slug is already taken.
 * Useful for providing early feedback before attempting creation.
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const workspace = await getWorkspaceBySlug(slug);
  return workspace === null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function err(error: WorkspaceServiceError): WorkspaceResult<never> {
  return { ok: false, error };
}
