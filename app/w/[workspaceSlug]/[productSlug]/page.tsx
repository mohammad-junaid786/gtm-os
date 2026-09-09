/**
 * Product Overview page — /w/[workspaceSlug]/[productSlug]
 *
 * The layout (layout.tsx) handles auth + context resolution and renders AppShell.
 * This page receives the resolved context from the layout via ProductContextProvider
 * and renders the product-aware Overview dashboard.
 *
 * Note: context resolution (auth, membership, product lookup) is performed
 * once in layout.tsx — NOT duplicated here. The layout calls notFound() on
 * any failure before this page renders.
 *
 * We re-resolve the context here only for generateMetadata (title).
 * The page itself reads context from the provider, not the DB.
 */
import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveProductContext } from "@/lib/routing/resolver";
import { ProductContextConsumer } from "@/components/layout/product-context-consumer";

// ---------------------------------------------------------------------------
// Metadata (separate from layout.tsx — Next.js uses the closest generateMetadata)
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug, productSlug } = await params;

  const userId = await getCurrentUserId();
  if (!userId) return { title: "Not Found" };

  const result = await resolveProductContext({ userId, workspaceSlug, productSlug });
  if (!result.ok) return { title: "Not Found" };

  return { title: "Overview" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProductOverviewPage() {
  // The layout has already verified auth + context. If we reach here, the
  // ProductContextProvider is available in the tree. We use a thin client
  // consumer to forward context to OverviewDashboard.
  return <ProductContextConsumer />;
}
