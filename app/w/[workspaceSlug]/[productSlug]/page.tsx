/**
 * Product route page — /w/[workspaceSlug]/[productSlug]
 *
 * Resolution chain:
 *   1. getCurrentUserId()         → null until auth is configured → notFound()
 *   2. resolveProductContext()    → workspace membership + product lookup
 *   3. Render product context     → (reached only once auth is wired up)
 *
 * Security:
 *   - No fake/default userId is ever substituted.
 *   - `resolveProductContext` establishes workspace membership before
 *     any product data is accessed.
 *   - Archived products, non-members, and missing resources all surface
 *     as `notFound()` — no distinguishing information is leaked.
 *
 * Next.js async params convention (Next.js 15+):
 *   `params` is a Promise and must be awaited before destructuring.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveProductContext } from "@/lib/routing/resolver";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug, productSlug } = await params;

  const userId = await getCurrentUserId();
  if (!userId) {
    return { title: "Not Found" };
  }

  const result = await resolveProductContext({ userId, workspaceSlug, productSlug });
  if (!result.ok) {
    return { title: "Not Found" };
  }

  return {
    title: result.data.product.name,
    description: `${result.data.product.name} in ${result.data.workspace.name}`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}) {
  const { workspaceSlug, productSlug } = await params;

  // Step 1: Obtain current user — null means auth is not yet configured.
  const userId = await getCurrentUserId();
  if (!userId) {
    // Authentication is not implemented yet.
    // Do not bypass authorization — fail via the standard not-found boundary.
    notFound();
  }

  // Step 2: Resolve workspace membership + product
  const result = await resolveProductContext({ userId, workspaceSlug, productSlug });
  if (!result.ok) {
    notFound();
  }

  // Step 3: Render (reached only once auth is wired up)
  const { workspace, product } = result.data;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>
        Workspace: {workspace.name} ({workspace.slug})
      </p>
      <p>Product slug: {product.slug}</p>
    </div>
  );
}
