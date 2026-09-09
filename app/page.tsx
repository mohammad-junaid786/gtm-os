import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "GTM OS" };

/**
 * Root page — rendered without the application shell.
 *
 * The full GTM OS application shell requires a resolved product context,
 * which requires authentication (not yet implemented). This page exists
 * as the entry point before a product is selected.
 *
 * Once authentication is implemented, this page can redirect authenticated
 * users to their product route. For now it provides a plain landing point.
 */
export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-foreground">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">GTM OS</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Open-source go-to-market operating system. Sign in to access your workspace and product.
        </p>
      </div>
      <p className="text-xs text-muted">
        Authentication is not yet configured.{" "}
        <Link href="/w/demo/demo-product" className="underline underline-offset-2 hover:text-foreground">
          Try the product route →
        </Link>
      </p>
    </div>
  );
}
