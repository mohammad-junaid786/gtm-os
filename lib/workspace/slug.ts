/**
 * Workspace slug utilities.
 *
 * Slugs are URL-safe, globally unique identifiers for workspaces.
 * They are lowercase ASCII, use hyphens as separators, and must
 * conform to: /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/ or a single
 * 1–63 character token with no trailing/leading hyphens.
 *
 * Rules (deliberate and documented):
 * - Derived from workspace name when not explicitly provided.
 * - Unicode letters are transliterated to ASCII where possible, then
 *   any remaining non-alphanumeric characters become hyphens.
 * - Runs of hyphens are collapsed to a single hyphen.
 * - Leading and trailing hyphens are stripped.
 * - Result is truncated to 63 characters (DNS label max).
 * - An empty result after normalization is rejected.
 * - Uniqueness is enforced by the database; the service layer must
 *   surface that constraint as a structured error.
 */

/** Characters allowed in a workspace slug. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/;

/**
 * Normalise an arbitrary string into a valid workspace slug candidate.
 * Returns `null` if the result would be empty after normalization.
 */
export function normalizeSlug(raw: string): string | null {
  const slug = raw
    .toLowerCase()
    // Replace common Unicode punctuation / whitespace with hyphens
    .replace(/[\s_./\\|,;:!?@#$%^&*()+='"`~<>[\]{}]+/g, "-")
    // Strip any character that isn't a-z, 0-9, or hyphen
    .replace(/[^a-z0-9-]/g, "")
    // Collapse consecutive hyphens
    .replace(/-{2,}/g, "-")
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Truncate to 63 characters (DNS label limit)
    .slice(0, 63)
    // Re-strip trailing hyphen that could appear after truncation
    .replace(/-+$/, "");

  return slug.length > 0 ? slug : null;
}

/**
 * Validate that a slug is well-formed.
 * Does NOT check uniqueness — that is the database's responsibility.
 */
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/**
 * Derive an initial slug candidate from a workspace name.
 * Throws if the name produces no usable characters.
 */
export function slugFromName(name: string): string {
  const slug = normalizeSlug(name);
  if (!slug) {
    throw new Error(
      `Cannot derive a slug from workspace name "${name}". ` +
        `Provide an explicit slug or use a name with alphanumeric characters.`,
    );
  }
  return slug;
}
