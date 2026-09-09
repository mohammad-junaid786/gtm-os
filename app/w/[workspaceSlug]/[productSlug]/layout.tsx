/**
 * Product route layout — /w/[workspaceSlug]/[productSlug]
 *
 * This layout wraps the product route without adding any visual shell
 * (Stage 5 will migrate the AppShell to be product-context-aware).
 * For now it simply renders children, keeping the existing AppShell
 * from the root layout.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "GTM OS", template: "%s · GTM OS" },
};

export default function ProductRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
