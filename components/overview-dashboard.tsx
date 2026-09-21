import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";

const placeholderStats = [
  { label: "Leads", hint: "No records yet" },
  { label: "Campaigns", hint: "No records yet" },
  { label: "Experiments", hint: "No records yet" },
  { label: "Personas", hint: "No records yet" },
] as const;

interface OverviewDashboardProps {
  /**
   * Workspace name from the resolved product context.
   * Undefined when rendered outside a product route (legacy).
   */
  workspaceName?: string;
  /**
   * Product name from the resolved product context.
   * Undefined when rendered outside a product route (legacy).
   */
  productName?: string;
}

export function OverviewDashboard({ workspaceName, productName }: OverviewDashboardProps) {
  const isProductScope = workspaceName && productName;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={isProductScope ? "PRODUCT" : "WORKSPACE"}
        title={productName ? productName : "Overview"}
        description={
          isProductScope
            ? `${workspaceName} · go-to-market overview. Metrics and activity will appear here once data exists.`
            : "A workspace-level view of go-to-market work. Metrics and activity will appear here once data exists."
        }
      />

      <section aria-labelledby="overview-kpis-heading">
        <h2 id="overview-kpis-heading" className="sr-only">
          {productName ? `${productName} metrics` : "Workspace metrics"}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {placeholderStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value="—" hint={stat.hint} />
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="overview-activity-heading">
        <div>
          <h2 id="overview-activity-heading" className="text-sm font-semibold text-foreground">
            Recent activity
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">A chronological feed of workspace events.</p>
        </div>
        <EmptyState
          title="No activity yet"
          description="There is nothing to show. Activity will list here when leads, campaigns, and experiments start generating events."
        />
      </section>
    </div>
  );
}
