import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import type { OverviewMetrics } from "@/lib/overview/service";
import type { AnalyticsData } from "@/components/layout/product-context-consumer";
import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { CampaignPerformanceChart } from "@/components/charts/campaign-performance-chart";
import { EmptyState } from "@/components/ui/empty-state";

interface OverviewDashboardProps {
  workspaceName?: string;
  productName?: string;
  metrics?: OverviewMetrics;
  analytics?: AnalyticsData;
}

export function OverviewDashboard({ workspaceName, productName, metrics, analytics }: OverviewDashboardProps) {
  const isProductScope = workspaceName && productName;

  const formatCurrency = (cents: number | null | undefined) => {
    if (cents === null || cents === undefined || cents === 0) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const hasFinancialData = 
    (analytics?.metrics?.totalCampaignSpendCents ?? 0) > 0 || 
    (analytics?.metrics?.totalCampaignRevenueCents ?? 0) > 0;

  const stats = [
    { 
      label: "Leads", 
      value: metrics?.totalLeads ? String(metrics.totalLeads) : "—", 
      hint: metrics?.totalLeads ? "Total leads in pipeline" : "No records yet" 
    },
    { 
      label: "Campaigns", 
      value: metrics?.totalCampaigns ? String(metrics.totalCampaigns) : "—", 
      hint: metrics?.totalCampaigns ? "Total campaigns" : "No records yet" 
    },
    { 
      label: "Experiments", 
      value: metrics?.totalExperiments ? String(metrics.totalExperiments) : "—", 
      hint: metrics?.totalExperiments ? "Total experiments" : "No records yet" 
    },
    { 
      label: "Total Spend", 
      value: hasFinancialData ? formatCurrency(analytics?.metrics?.totalCampaignSpendCents) : "—", 
      hint: hasFinancialData ? "Across all campaigns" : "No spend recorded" 
    },
    { 
      label: "Total Revenue", 
      value: hasFinancialData ? formatCurrency(analytics?.metrics?.totalCampaignRevenueCents) : "—", 
      hint: hasFinancialData ? "Attributed revenue" : "No revenue recorded" 
    },
    { 
      label: "Overall ROAS", 
      value: analytics?.metrics?.overallRoas ? `${analytics.metrics.overallRoas.toFixed(2)}x` : "—", 
      hint: analytics?.metrics?.overallRoas ? "Return on ad spend" : "Not enough data" 
    },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={isProductScope ? "PRODUCT COMMAND CENTER" : "WORKSPACE OVERVIEW"}
        title={productName ? productName : "Overview"}
        description={
          isProductScope
            ? "High-level performance of your go-to-market system."
            : "A workspace-level view of go-to-market work."
        }
      />

      <section aria-labelledby="overview-kpis-heading">
        <h2 id="overview-kpis-heading" className="sr-only">
          Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-labelledby="overview-pipeline-heading" className="bg-card border border-border shadow-sm rounded-xl p-6">
          <header className="mb-6">
            <h2 id="overview-pipeline-heading" className="text-base font-semibold text-foreground">
              Pipeline Funnel
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Lead progression across all campaigns.</p>
          </header>
          <PipelineFunnelChart data={analytics?.funnel ?? []} />
        </section>

        <section aria-labelledby="overview-campaign-heading" className="bg-card border border-border shadow-sm rounded-xl p-6">
          <header className="mb-6">
            <h2 id="overview-campaign-heading" className="text-base font-semibold text-foreground">
              Campaign Performance
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Spend versus revenue by campaign.</p>
          </header>
          <CampaignPerformanceChart data={analytics?.campaigns ?? []} />
        </section>
      </div>

      {/* Keep the Execution/Learning summary or Activity feed placeholder below if real data isn't wired yet */}
      <section className="space-y-4 pt-4 border-t border-border/50" aria-labelledby="overview-activity-heading">
        <div>
          <h2 id="overview-activity-heading" className="text-sm font-semibold text-foreground">
            Recent Activity
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Chronological events will appear here.</p>
        </div>
        <EmptyState
          title="No activity yet"
          description="Activity will list here when leads, campaigns, and experiments start generating events."
        />
      </section>
    </div>
  );
}
