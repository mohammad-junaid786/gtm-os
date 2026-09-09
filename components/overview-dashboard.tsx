import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

const placeholderStats = [
  { label: "Accounts", hint: "No records yet" },
  { label: "Contacts", hint: "No records yet" },
  { label: "Campaigns", hint: "No records yet" },
  { label: "Plays", hint: "No records yet" },
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
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {productName ? productName : "Overview"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          {workspaceName && productName ? (
            <>
              <span className="font-medium text-foreground">{workspaceName}</span>
              {" · "}
              {productName} — go-to-market overview. Metrics and activity will appear here once
              data exists.
            </>
          ) : (
            "A workspace-level view of go-to-market work. Metrics and activity will appear here once data exists."
          )}
        </p>
      </div>

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

      <section className="space-y-3" aria-labelledby="overview-activity-heading">
        <div>
          <h2 id="overview-activity-heading" className="text-sm font-medium text-foreground">
            Recent activity
          </h2>
          <p className="mt-0.5 text-sm text-muted">A chronological feed of workspace events.</p>
        </div>
        <EmptyState
          title="No activity yet"
          description="There is nothing to show. Activity will list here when accounts, campaigns, and plays start generating events."
        />
      </section>
    </div>
  );
}
