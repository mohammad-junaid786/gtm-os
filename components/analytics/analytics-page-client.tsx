"use client";

import { useEffect, useState, useTransition } from "react";
import { useProductContext } from "@/lib/product-context";
import {
  loadGtmMetricsAction,
  loadPipelineFunnelAction,
  loadCampaignPerformanceAction,
  loadLeadsOverTimeAction,
  loadLeadStatusDistributionAction,
  loadExperimentStatusDistributionAction,
  loadStrategicVolumeAction,
  loadAvailableFiltersAction
} from "@/lib/analytics/actions";
import type { 
  GtmMetrics, 
  PipelineFunnel, 
  CampaignPerformance,
  AnalyticsFilters,
  AvailableFilters
} from "@/lib/analytics/types";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time-chart";
import { LeadDistributionChart } from "@/components/charts/lead-distribution-chart";
import { CampaignEfficiencyScatter } from "@/components/charts/campaign-efficiency-scatter";
import { ExperimentStatusChart } from "@/components/charts/experiment-status-chart";
import { StrategicVolumeChart } from "@/components/charts/strategic-volume-chart";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";
import { ContextualLearningDialog } from "@/components/learnings/contextual-learning-dialog";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyticsPageClient() {
  const { productId } = useProductContext();
  const [isPending, startTransition] = useTransition();

  const [activeFilters, setActiveFilters] = useState<AnalyticsFilters>({});
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(null);

  const [metrics, setMetrics] = useState<GtmMetrics | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnel[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [leadsOverTime, setLeadsOverTime] = useState<{ period: string; count: number }[]>([]);
  const [leadDistribution, setLeadDistribution] = useState<{ status: string; count: number }[]>([]);
  const [experimentStatus, setExperimentStatus] = useState<{ status: string; count: number }[]>([]);
  const [strategicVolume, setStrategicVolume] = useState<{ totalLearnings: number; totalResearchItems: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showLearningDialog, setShowLearningDialog] = useState(false);

  // Initial load to get available filters
  useEffect(() => {
    loadAvailableFiltersAction(productId).then(res => {
      if (res.ok) setAvailableFilters(res.data);
    });
  }, [productId]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const [
          metricsRes, 
          funnelRes, 
          campaignsRes, 
          leadsTimeRes, 
          distRes, 
          expRes, 
          stratRes
        ] = await Promise.all([
          loadGtmMetricsAction(productId, activeFilters),
          loadPipelineFunnelAction(productId, activeFilters),
          loadCampaignPerformanceAction(productId, activeFilters),
          loadLeadsOverTimeAction(productId, activeFilters),
          loadLeadStatusDistributionAction(productId, activeFilters),
          loadExperimentStatusDistributionAction(productId, activeFilters),
          loadStrategicVolumeAction(productId, activeFilters),
        ]);

        if (
          metricsRes.ok && 
          funnelRes.ok && 
          campaignsRes.ok && 
          leadsTimeRes.ok && 
          distRes.ok && 
          expRes.ok && 
          stratRes.ok
        ) {
          setMetrics(metricsRes.data);
          setFunnel(funnelRes.data);
          setCampaigns(campaignsRes.data);
          setLeadsOverTime(leadsTimeRes.data);
          setLeadDistribution(distRes.data);
          setExperimentStatus(expRes.data);
          setStrategicVolume(stratRes.data);
        } else {
          setError("Failed to load analytics data.");
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoaded(true);
      }
    });
  }, [productId, activeFilters]);

  if (!loaded || isPending) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-500">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading analytics"
        description={error}
      />
    );
  }

  if (!metrics) {
    return null;
  }

  const formatCurrency = (cents: number | null, compact = false) => {
    if (cents === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? "compact" : "standard",
    }).format(cents / 100);
  };

  const getSourceContext = () => {
    const contextLines = [];
    if (activeFilters.startDate || activeFilters.endDate) {
      contextLines.push(`Date: ${activeFilters.startDate || "Any"} to ${activeFilters.endDate || "Any"}`);
    }
    if (activeFilters.campaignId) {
      const campaignName = availableFilters?.campaigns.find(c => c.id === activeFilters.campaignId)?.name || "Unknown";
      contextLines.push(`Campaign: ${campaignName}`);
    }
    if (activeFilters.leadStatus) {
      contextLines.push(`Lead Status: ${activeFilters.leadStatus.charAt(0).toUpperCase() + activeFilters.leadStatus.slice(1)}`);
    }
    if (activeFilters.experimentStatus) {
      const formattedStatus = activeFilters.experimentStatus.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      contextLines.push(`Experiment Status: ${formattedStatus}`);
    }
    return contextLines.length > 0 ? contextLines.join("\n") : "Filters: None (All Data)";
  };

  return (
    <div className="space-y-12 max-w-6xl">
      <div className="flex items-start justify-between">
        <PageHeader
          eyebrow="MEASUREMENT"
          title="Analytics & Measurement"
          description="Performance metrics for your go-to-market execution."
        />
        <Button onClick={() => setShowLearningDialog(true)} className="mt-1">
          <Lightbulb className="mr-2 h-4 w-4" />
          Log Learning
        </Button>
      </div>

      <AnalyticsFilterBar  
        activeFilters={activeFilters}
        availableFilters={availableFilters}
        onChange={setActiveFilters}
        onReset={() => setActiveFilters({})}
      />

      <section aria-labelledby="kpis-heading">
        <h2 id="kpis-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Spend"
            value={formatCurrency(metrics.totalCampaignSpendCents)}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(metrics.totalCampaignRevenueCents)}
          />
          <StatCard
            label="Overall ROAS"
            value={metrics.overallRoas !== null ? `${metrics.overallRoas.toFixed(2)}x` : "—"}
          />
          <StatCard
            label="Overall CAC"
            value={formatCurrency(metrics.overallCacCents)}
          />
        </div>
      </section>

      <section aria-labelledby="leads-over-time-heading" className="pt-4">
        <h2 id="leads-over-time-heading" className="text-sm font-semibold text-foreground">
          Leads Over Time
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Growth of lead generation over time.</p>
        <div className="mt-6">
          <LeadsOverTimeChart data={leadsOverTime} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <section aria-labelledby="lead-distribution-heading">
          <h2 id="lead-distribution-heading" className="text-sm font-semibold text-foreground">
            Lead Distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Current breakdown of leads by status.</p>
          <div className="mt-6">
            <LeadDistributionChart data={leadDistribution} />
          </div>
        </section>

        <section aria-labelledby="campaign-efficiency-heading">
          <h2 id="campaign-efficiency-heading" className="text-sm font-semibold text-foreground">
            Campaign Efficiency
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Spend vs Revenue across all campaigns.</p>
          <div className="mt-6">
            <CampaignEfficiencyScatter data={campaigns} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <section aria-labelledby="pipeline-funnel-heading">
          <h2 id="pipeline-funnel-heading" className="text-sm font-semibold text-foreground">
            Pipeline Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Lead progression across all campaigns.</p>
          {funnel.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center mt-6 border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
              <p className="text-sm font-medium text-foreground">No pipeline data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add leads to see your funnel conversion rates.
              </p>
            </div>
          ) : (
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="status" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', boxShadow: 'none', fontSize: '12px', padding: '8px 12px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                    itemStyle={{ fontWeight: 500, color: "var(--foreground)" }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 2, 2, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-labelledby="campaign-performance-heading">
          <h2 id="campaign-performance-heading" className="text-sm font-semibold text-foreground">
            Campaign Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Spend versus revenue by campaign.</p>
          {campaigns.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center mt-6 border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
              <p className="text-sm font-medium text-foreground">No campaign data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run campaigns and track spend/revenue to see performance.
              </p>
            </div>
          ) : (
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaigns} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }} 
                    contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', boxShadow: 'none', fontSize: '12px', padding: '8px 12px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                    formatter={(val: number, name: string) => [formatCurrency(val), name === "revenue" ? "Revenue" : "Spend"]}
                    itemStyle={{ fontWeight: 500 }}
                  />
                  <Bar dataKey="spend" fill="var(--muted-foreground)" radius={[2, 2, 0, 0]} name="Spend" barSize={16} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Revenue" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4 border-t border-border/40 mt-12">
        <section aria-labelledby="experiment-status-heading" className="pt-8">
          <h2 id="experiment-status-heading" className="text-sm font-semibold text-foreground">
            Experiment Status
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Current state of active and completed experiments.</p>
          <div className="mt-6">
            <ExperimentStatusChart data={experimentStatus} />
          </div>
        </section>

        <section aria-labelledby="strategic-volume-heading" className="pt-8">
          <h2 id="strategic-volume-heading" className="text-sm font-semibold text-foreground">
            Strategic Activity
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Volume of foundational research and learnings.</p>
          <div className="mt-6">
            <StrategicVolumeChart data={strategicVolume} />
          </div>
        </section>
      </div>

      <ContextualLearningDialog
        open={showLearningDialog}
        onOpenChange={setShowLearningDialog}
        productId={productId}
        sourceType="analytics"
        sourceId={undefined}
        sourceDisplayName="Analytics Dashboard"
        sourceContext={getSourceContext()}
        onSuccess={() => setShowLearningDialog(false)}
      />
    </div>
  );
}
