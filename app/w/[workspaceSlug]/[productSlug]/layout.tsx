/**
 * Product route layout — /w/[workspaceSlug]/[productSlug]
 *
 * Stage 5: This layout is now the home of the GTM OS application shell.
 *
 * Responsibilities:
 *   1. Obtain the current user ID from the auth seam.
 *   2. Resolve workspace membership + active product via Stage 4 resolver.
 *   3. Build product-scoped navigation.
 *   4. Render AppShell with resolved context.
 *   5. Provide serializable ProductContext to client components.
 *
 * Security:
 *   - Calls notFound() if auth is not configured (getCurrentUserId → null).
 *   - Calls notFound() for any resolution failure (not a member, no product,
 *     archived product) — no distinguishing information is leaked.
 *   - No fake/default userId is ever used.
 *
 * Server/client boundary:
 *   - All DB access stays server-side.
 *   - Only serializable fields (strings) are passed to the client provider.
 *
 * Next.js async params convention (Next.js 15+):
 *   params is a Promise and must be awaited before use.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ProductContextProvider } from "@/lib/product-context";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveProductContext } from "@/lib/routing/resolver";
import { buildProductNav } from "@/lib/navigation";

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
  if (!userId) return { title: "Not Found" };

  const result = await resolveProductContext({ userId, workspaceSlug, productSlug });
  if (!result.ok) return { title: "Not Found" };

  return {
    title: {
      default: result.data.product.name,
      template: `%s · ${result.data.product.name} · GTM OS`,
    },
    description: `${result.data.product.name} — ${result.data.workspace.name} on GTM OS`,
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function ProductRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}) {
  const { workspaceSlug, productSlug } = await params;

  // Step 1: Auth seam — null until auth provider is wired up.
  const userId = await getCurrentUserId();
  if (!userId) {
    notFound();
  }

  // Step 2: Membership-aware context resolution.
  const result = await resolveProductContext({ userId, workspaceSlug, productSlug });
  if (!result.ok) {
    notFound();
  }

  const { workspace, product } = result.data;

  // Step 3: Build product-scoped navigation.
  const basePath = `/w/${workspace.slug}/${product.slug}`;
  const { sections, settingsItem } = buildProductNav(basePath);

  // Step 4: Serializable context for the client provider.
  const contextValue = {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
  };

  // Step 5: Render AppShell with product context.
  return (
    <ProductContextProvider value={contextValue}>
      <AppShell
        sections={sections}
        settingsItem={settingsItem}
        workspaceName={workspace.name}
        productName={product.name}
      >
        {children}
      </AppShell>
    </ProductContextProvider>
  );
}
