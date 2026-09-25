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

  const financialStats = [
    { 
      label: "Total Revenue", 
      value: hasFinancialData ? formatCurrency(analytics?.metrics?.totalCampaignRevenueCents) : "—", 
      hint: hasFinancialData ? "Attributed revenue" : "No revenue recorded" 
    },
    { 
      label: "Total Spend", 
      value: hasFinancialData ? formatCurrency(analytics?.metrics?.totalCampaignSpendCents) : "—", 
      hint: hasFinancialData ? "Across all campaigns" : "No spend recorded" 
    },
    { 
      label: "Overall ROAS", 
      value: analytics?.metrics?.overallRoas ? `${analytics.metrics.overallRoas.toFixed(2)}x` : "—", 
      hint: analytics?.metrics?.overallRoas ? "Return on ad spend" : "Not enough data" 
    },
  ];

  const operationalStats = [
    { label: "Leads", value: metrics?.totalLeads ? String(metrics.totalLeads) : "0" },
    { label: "Campaigns", value: metrics?.totalCampaigns ? String(metrics.totalCampaigns) : "0" },
    { label: "Experiments", value: metrics?.totalExperiments ? String(metrics.totalExperiments) : "0" },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Page Header with Operational Summary */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border-subtle pb-8">
        <PageHeader
          eyebrow={isProductScope ? "PRODUCT COMMAND CENTER" : "WORKSPACE OVERVIEW"}
          title={productName ? productName : "Overview"}
          description={
            isProductScope
              ? "High-level performance of your go-to-market system."
              : "A workspace-level view of go-to-market work."
          }
          className="max-w-xl"
        />
        
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          {operationalStats.map((stat) => (
            <div key={stat.label} className="space-y-1.5">
              <p className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
                {stat.label}
              </p>
              <p className="font-mono text-2xl font-medium tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* 2. Primary KPI Snapshot */}
      <section aria-labelledby="overview-financials-heading">
        <h2 id="overview-financials-heading" className="sr-only">
          Financial Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financialStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
          ))}
        </div>
      </section>

      {/* 3. Primary Analytics (Asymmetric Layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <section aria-labelledby="overview-campaign-heading" className="xl:col-span-2 bg-surface border border-border-subtle rounded-xl p-8">
          <header className="mb-8">
            <h2 id="overview-campaign-heading" className="text-base font-semibold text-foreground">
              Campaign Performance
            </h2>
            <p className="text-sm text-foreground-secondary mt-1">Spend versus revenue by campaign.</p>
          </header>
          <CampaignPerformanceChart data={analytics?.campaigns ?? []} />
        </section>

        <section aria-labelledby="overview-pipeline-heading" className="xl:col-span-1 bg-surface border border-border-subtle rounded-xl p-8 flex flex-col">
          <header className="mb-8">
            <h2 id="overview-pipeline-heading" className="text-base font-semibold text-foreground">
              Pipeline Funnel
            </h2>
            <p className="text-sm text-foreground-secondary mt-1">Lead progression across all campaigns.</p>
          </header>
          <div className="flex-1">
            <PipelineFunnelChart data={analytics?.funnel ?? []} />
          </div>
        </section>
      </div>

      {/* 4. Execution / Activity Snapshot */}
      <section className="space-y-6 pt-8 border-t border-border-subtle" aria-labelledby="overview-activity-heading">
        <header>
          <h2 id="overview-activity-heading" className="text-sm font-semibold text-foreground">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Chronological events across your go-to-market motion.
          </p>
        </header>
        <EmptyState
          title="No activity yet"
          description="Activity will list here when leads, campaigns, and experiments start generating events."
        />
      </section>
    </div>
  );
}
