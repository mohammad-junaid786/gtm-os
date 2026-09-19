/**
 * Positioning page — /w/[workspaceSlug]/[productSlug]/strategy/positioning
 *
 * Resolution chain (established by the parent product layout):
 *   getCurrentUserId() -> resolveProductContext() -> AppShell + ProductContextProvider
 *
 * This page is only reachable if the product layout succeeds. It does NOT
 * re-run auth or workspace resolution — it reads from the context already
 * established by the layout.
 *
 * Server-side:
 *   - Awaits params to satisfy Next.js 15+ async params convention.
 *   - Delegates data fetching to PositioningPageClient (client component)
 *     which reads productId from useProductContext() and calls a server
 *     action to load positioning data.
 *
 * Client-side (PositioningPageClient):
 *   - Manages loading/empty/loaded/error state
 *   - Calls Server Actions for mutations
 */
import type { Metadata } from "next";
import { PositioningPageClient } from "@/components/positioning/positioning-page-client";

// The product layout sets the metadata template: "%s · {productName} · GTM OS"
export const metadata: Metadata = { title: "Positioning" };

interface PositioningPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function PositioningPage({ params }: PositioningPageProps) {
  // Await params to follow Next.js 15+ async params convention.
  // productId is available to the client via useProductContext().
  await params;

  return <PositioningPageClient />;
}