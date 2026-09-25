import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/routing/current-user";
import { resolveWorkspaceForUser } from "@/lib/routing/resolver";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PackageOpen } from "lucide-react";

export default async function WorkspaceEmptyStatePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    notFound();
  }

  const workspaceResult = await resolveWorkspaceForUser(userId, workspaceSlug);
  if (!workspaceResult.ok) {
    notFound();
  }

  const workspace = workspaceResult.data;

  const db = getDb();
  const activeProducts = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      and(
        eq(products.workspace_id, workspace.id),
        isNull(products.archived_at)
      )
    )
    .orderBy(asc(products.created_at));

  if (activeProducts.length > 0) {
    // If there are products, this shouldn't be the empty state. Redirect to the first product.
    redirect(`/w/${workspace.slug}/${activeProducts[0].slug}`);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col">
      <Header
        mobileNavOpen={false}
        onOpenMobileNav={() => {}}
        productName="No Products"
      />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <PackageOpen className="size-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No products found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your workspace is empty. Create your first product to start tracking your GTM strategy, campaigns, and insights.
        </p>
        <Link href={`/onboarding?mode=create-product&workspaceId=${workspace.id}`}>
          <Button size="lg">Create Product</Button>
        </Link>
      </main>
    </div>
  );
}
