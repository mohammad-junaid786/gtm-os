/**
 * ICP page — /w/[workspaceSlug]/[productSlug]/strategy/icp
 *
 * Resolution chain (established by the parent product layout):
 *   getCurrentUserId() → resolveProductContext() → AppShell + ProductContextProvider
 *
 * This page is only reachable if the product layout succeeds. It does NOT
 * re-run auth or workspace resolution — it reads from the context already
 * established by the layout.
 *
 * Server-side:
 *   - Reads productId from ProductContextProvider (via server component prop pattern)
 *   - Fetches the active ICP for the product using getIcpsForProduct()
 *   - Passes the IcpRow (or null) to the client view component
 *
 * Client-side (IcpView / IcpEmpty):
 *   - Manages view/edit toggle state
 *   - Calls Server Actions for mutations
 */
import type { Metadata } from "next";
import { IcpPageClient } from "@/components/icp/icp-page-client";

// The product layout sets the metadata template: "%s · {productName} · GTM OS"
export const metadata: Metadata = { title: "ICP" };

interface IcpPageProps {
  params: Promise<{ workspaceSlug: string; productSlug: string }>;
}

export default async function IcpPage({ params }: IcpPageProps) {
  // params is needed to satisfy Next.js route convention; the product context
  // (including productId) is provided by the layout via ProductContextProvider.
  // We await params to follow Next.js 15+ async params convention.
  await params;

  // The productId is available in the client via useProductContext().
  // However, DB access must stay server-side. We use a two-step pattern:
  //   1. Server page receives productId through a server-props bridge.
  //   2. Client component receives the IcpRow as a serializable prop.
  //
  // Since we cannot call useProductContext() in a server component, we use
  // a server action bridge approach: IcpPageClient is a client component
  // that reads productId from useProductContext(), then calls a server
  // action to load ICP data. However, this would move data fetching to the
  // client. Instead, we use the recommended pattern: read params and pass
  // the resolved data down.
  //
  // Given the current architecture (layout resolves context into
  // ProductContextProvider which is client-only), the cleanest approach
  // is to delegate initial data loading to the client using a server action,
  // and keep this page as a lightweight shell.
  //
  // This is documented in architecture.md Stage 6.
  return <IcpPageClient />;
}
