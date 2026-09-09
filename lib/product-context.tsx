"use client";

/**
 * Client-side ProductContext provider and hook.
 *
 * The server layout (app/w/[workspaceSlug]/[productSlug]/layout.tsx) resolves
 * the full ProductContext server-side, then passes only serializable fields
 * (strings) down to this client provider. This keeps database access and
 * server-only modules strictly on the server.
 *
 * Components inside the product shell can call `useProductContext()` to
 * access workspace and product display names and slugs without making
 * additional database calls.
 *
 * Architecture note:
 *   Server layout → resolveProductContext() → passes serializable summary
 *   → <ProductContextProvider> → useProductContext() in child components
 */

import { createContext, use } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Serializable subset of ProductContext passed from server → client.
 * Only what the UI actually needs — no raw DB objects in client bundles.
 */
export interface ProductContextValue {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  productId: string;
  productName: string;
  productSlug: string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ProductCtx = createContext<ProductContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProductContextProvider({
  value,
  children,
}: {
  value: ProductContextValue;
  children: React.ReactNode;
}) {
  return <ProductCtx value={value}>{children}</ProductCtx>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the resolved workspace/product context from within the product shell.
 *
 * Must be used inside a <ProductContextProvider>. Throws if called outside.
 */
export function useProductContext(): ProductContextValue {
  const ctx = use(ProductCtx);
  if (!ctx) {
    throw new Error(
      "useProductContext must be used inside a ProductContextProvider. " +
        "This component must be rendered within the product route layout.",
    );
  }
  return ctx;
}
