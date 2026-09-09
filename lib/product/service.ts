/**
 * Product service — server-side only.
 *
 * All operations are workspace-scoped. A product ID alone is never
 * sufficient context — every method requires an explicit workspaceId to
 * prevent cross-workspace access (IDOR).
 *
 * Design decisions (from docs/architecture.md Stage 3):
 * - Products belong to exactly one workspace via workspace_id FK.
 * - Products are never hard-deleted; archiving sets archived_at.
 * - Active products:  archived_at IS NULL.
 * - Archived products: archived_at IS NOT NULL.
 * - Slug uniqueness is (workspace_id, slug) — same slug may appear in
 *   different workspaces but NOT twice in the same one, even if archived.
 * - The database constraint products_workspace_id_slug_unique is the final
 *   authority; PG error 23505 is mapped to SLUG_CONFLICT.
 * - No restoration API is provided (architecture.md explicitly defers it).
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { normalizeSlug, isValidSlug, slugFromName } from "@/lib/workspace/slug";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductRow,
  ProductResult,
  ProductServiceError,
} from "./types";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createProductSchema = z.object({
  workspaceId: z.string().uuid("workspaceId must be a valid UUID"),
  name: z.string().min(1, "Product name cannot be empty").max(255),
  slug: z.string().optional(),
});

const updateProductSchema = z
  .object({
    name: z.string().min(1, "Product name cannot be empty").max(255).optional(),
    slug: z.string().optional(),
  })
  .refine((d) => d.name !== undefined || d.slug !== undefined, {
    message: "At least one field (name or slug) must be provided for update.",
  });

// ---------------------------------------------------------------------------
// PostgreSQL error codes
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
// Internal helpers
// ---------------------------------------------------------------------------

function fail(error: ProductServiceError): ProductResult<never> {
  return { ok: false, error };
}

/**
 * Resolve a slug from either an explicit value or a product name.
 * Returns `{ ok: true, slug }` or `{ ok: false, error }`.
 */
function resolveSlug(
  rawSlug: string | undefined,
  name: string,
): { ok: true; slug: string } | { ok: false; error: ProductServiceError } {
  if (rawSlug !== undefined) {
    const normalized = normalizeSlug(rawSlug);
    if (!normalized) {
      return {
        ok: false,
        error: {
          code: "SLUG_INVALID",
          message: `The provided slug "${rawSlug}" produces an empty value after normalization.`,
          slug: rawSlug,
        },
      };
    }
    if (!isValidSlug(normalized)) {
      return {
        ok: false,
        error: {
          code: "SLUG_INVALID",
          message: `Slug "${normalized}" is not a valid product slug. Use lowercase letters, numbers, and hyphens only.`,
          slug: normalized,
        },
      };
    }
    return { ok: true, slug: normalized };
  }

  try {
    return { ok: true, slug: slugFromName(name) };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "SLUG_INVALID",
        message:
          e instanceof Error
            ? e.message
            : `Cannot derive a slug from product name "${name}".`,
        slug: "",
      },
    };
  }
}

/** Map a DB row to the public ProductRow type. */
function toProductRow(row: {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): ProductRow {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    slug: row.slug,
    archived_at: row.archived_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a product within a workspace.
 *
 * Slug resolution order:
 * 1. If `input.slug` is provided: normalise then validate.
 * 2. If omitted: derive from `input.name`.
 *
 * The (workspace_id, slug) unique constraint is enforced by the database.
 * Conflicts map to SLUG_CONFLICT regardless of whether the conflicting
 * product is active or archived.
 */
export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResult<ProductRow>> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path.includes("workspaceId")) {
      return fail({ code: "WORKSPACE_ID_INVALID", message: issue.message });
    }
    if (issue.path.includes("name")) {
      return fail({ code: "NAME_EMPTY", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  const { workspaceId, name } = parsed.data;

  const slugResult = resolveSlug(parsed.data.slug, name);
  if (!slugResult.ok) return fail(slugResult.error);
  const slug = slugResult.slug;

  try {
    const db = getDb();
    const [row] = await db
      .insert(products)
      .values({ workspace_id: workspaceId, name, slug })
      .returning();
    return { ok: true, data: toProductRow(row) };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return fail({
        code: "SLUG_CONFLICT",
        message: `A product with slug "${slug}" already exists in this workspace. Choose a different name or slug.`,
        slug,
      });
    }
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Retrieve a product by ID, scoped to a workspace.
 *
 * Returns PRODUCT_NOT_FOUND if the product does not exist OR belongs to
 * a different workspace — the caller cannot distinguish the two cases,
 * which is intentional (prevents information leakage about other workspaces).
 *
 * Both active and archived products are returned by this method.
 * Callers that need only active products should check `archived_at === null`.
 */
export async function getProductById(
  workspaceId: string,
  productId: string,
): Promise<ProductResult<ProductRow>> {
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) {
    return fail({ code: "WORKSPACE_ID_INVALID", message: "workspaceId must be a valid UUID." });
  }
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.workspace_id, workspaceId), eq(products.id, productId)))
      .limit(1);

    if (rows.length === 0) {
      return fail({ code: "PRODUCT_NOT_FOUND", message: "Product not found." });
    }
    return { ok: true, data: toProductRow(rows[0]) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * List all ACTIVE (non-archived) products for a workspace, ordered by name.
 *
 * Archived products are excluded. Use `getProductById` to retrieve an
 * archived product by ID when needed.
 */
export async function getProductsForWorkspace(
  workspaceId: string,
): Promise<ProductResult<ProductRow[]>> {
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) {
    return fail({ code: "WORKSPACE_ID_INVALID", message: "workspaceId must be a valid UUID." });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.workspace_id, workspaceId), isNull(products.archived_at)))
      .orderBy(products.name);

    return { ok: true, data: rows.map(toProductRow) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Update mutable fields on an active product.
 *
 * Only `name` and `slug` may be updated. At least one must be provided.
 * Archived products cannot be updated — returns PRODUCT_ALREADY_ARCHIVED.
 *
 * The operation is workspace-scoped: a productId in a different workspace
 * returns PRODUCT_NOT_FOUND.
 */
export async function updateProduct(
  workspaceId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<ProductResult<ProductRow>> {
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) {
    return fail({ code: "WORKSPACE_ID_INVALID", message: "workspaceId must be a valid UUID." });
  }
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // The only refine error means no fields were supplied
    if (issue.code === "custom") {
      return fail({ code: "NO_UPDATE_FIELDS", message: issue.message });
    }
    if (issue.path.includes("name")) {
      return fail({ code: "NAME_EMPTY", message: issue.message });
    }
    return fail({ code: "UNKNOWN", message: issue.message });
  }

  // Pre-validate the explicit slug before touching the database.
  // If an explicit slug is provided but invalid, return SLUG_INVALID immediately
  // without making any DB call. Name-only updates skip this block entirely.
  let prevalidatedSlug: string | undefined;
  if (parsed.data.slug !== undefined) {
    const slugResult = resolveSlug(parsed.data.slug, "placeholder");
    if (!slugResult.ok) return fail(slugResult.error);
    prevalidatedSlug = slugResult.slug;
  }

  let newSlug = "";

  try {
    const db = getDb();

    // Fetch current state — required to:
    // a) confirm product belongs to this workspace
    // b) confirm product is not archived
    // c) preserve existing slug when none is explicitly provided
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.workspace_id, workspaceId), eq(products.id, productId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "PRODUCT_NOT_FOUND", message: "Product not found." });
    }

    const current = existing[0];

    if (current.archived_at !== null) {
      return fail({
        code: "PRODUCT_ALREADY_ARCHIVED",
        message: "Cannot update an archived product.",
      });
    }

    // Resolve the new name and slug
    const newName = parsed.data.name ?? current.name;

    if (prevalidatedSlug !== undefined) {
      // Use the already-validated explicit slug
      newSlug = prevalidatedSlug;
    } else {
      // No explicit slug — preserve the existing slug regardless of name change.
      // Slug derivation from name happens only at creation time.
      newSlug = current.slug;
    }

    const now = new Date();
    const [updated] = await db
      .update(products)
      .set({ name: newName, slug: newSlug, updated_at: now })
      .where(and(eq(products.workspace_id, workspaceId), eq(products.id, productId)))
      .returning();

    return { ok: true, data: toProductRow(updated) };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return fail({
        code: "SLUG_CONFLICT",
        message: `A product with slug "${newSlug}" already exists in this workspace.`,
        slug: newSlug,
      });
    }
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}

/**
 * Archive a product within a workspace.
 *
 * Sets `archived_at` to the current timestamp. The product row remains
 * in the database and the slug remains reserved (preventing reuse in
 * the same workspace).
 *
 * Archiving an already-archived product returns PRODUCT_ALREADY_ARCHIVED.
 * The operation is workspace-scoped: a productId in a different workspace
 * returns PRODUCT_NOT_FOUND.
 */
export async function archiveProduct(
  workspaceId: string,
  productId: string,
): Promise<ProductResult<ProductRow>> {
  const wid = uuidSchema.safeParse(workspaceId);
  if (!wid.success) {
    return fail({ code: "WORKSPACE_ID_INVALID", message: "workspaceId must be a valid UUID." });
  }
  const pid = uuidSchema.safeParse(productId);
  if (!pid.success) {
    return fail({ code: "PRODUCT_ID_INVALID", message: "productId must be a valid UUID." });
  }

  try {
    const db = getDb();

    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.workspace_id, workspaceId), eq(products.id, productId)))
      .limit(1);

    if (existing.length === 0) {
      return fail({ code: "PRODUCT_NOT_FOUND", message: "Product not found." });
    }

    if (existing[0].archived_at !== null) {
      return fail({
        code: "PRODUCT_ALREADY_ARCHIVED",
        message: "Product is already archived.",
      });
    }

    const now = new Date();
    const [archived] = await db
      .update(products)
      .set({ archived_at: now, updated_at: now })
      .where(and(eq(products.workspace_id, workspaceId), eq(products.id, productId)))
      .returning();

    return { ok: true, data: toProductRow(archived) };
  } catch (e) {
    return fail({ code: "UNKNOWN", message: "An unexpected error occurred.", cause: e });
  }
}
