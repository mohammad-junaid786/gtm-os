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
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time-chart";
import { LeadDistributionChart } from "@/components/charts/lead-distribution-chart";
import { CampaignEfficiencyScatter } from "@/components/charts/campaign-efficiency-scatter";
import { ExperimentStatusChart } from "@/components/charts/experiment-status-chart";
import { StrategicVolumeChart } from "@/components/charts/strategic-volume-chart";
import { AnalyticsFilterBar } from "@/components/analytics/analytics-filter-bar";
import { ContextualLearningDialog } from "@/components/learnings/contextual-learning-dialog";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PipelineFunnelChart } from "@/components/charts/pipeline-funnel-chart";
import { CampaignPerformanceChart } from "@/components/charts/campaign-performance-chart";

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
      <div className="flex items-center justify-center h-64 text-sm text-foreground-secondary">
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
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeader
          eyebrow="MEASUREMENT"
          title="Analytics"
          description="Performance metrics for your go-to-market execution."
          className="max-w-xl"
        />
        <Button onClick={() => setShowLearningDialog(true)} className="mt-1 md:mt-0 shrink-0">
          <Lightbulb className="mr-2 h-4 w-4" />
          Log Learning
        </Button>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar  
        activeFilters={activeFilters}
        availableFilters={availableFilters}
        onChange={setActiveFilters}
        onReset={() => setActiveFilters({})}
      />

      {/* KPI Snapshot */}
      <section aria-labelledby="kpis-heading" className="mb-8">
        <h2 id="kpis-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="flex flex-col bg-surface border border-border-subtle rounded-xl p-5">
            <span className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase mb-1">Total Spend</span>
            <span className="text-2xl font-medium text-foreground tracking-tight">{formatCurrency(metrics.totalCampaignSpendCents)}</span>
          </div>
          <div className="flex flex-col bg-surface border border-border-subtle rounded-xl p-5">
            <span className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase mb-1">Total Revenue</span>
            <span className="text-2xl font-medium text-foreground tracking-tight">{formatCurrency(metrics.totalCampaignRevenueCents)}</span>
          </div>
          <div className="flex flex-col bg-surface border border-border-subtle rounded-xl p-5">
            <span className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase mb-1">Overall ROAS</span>
            <span className="text-2xl font-medium text-foreground tracking-tight">{metrics.overallRoas !== null ? `${metrics.overallRoas.toFixed(2)}x` : "—"}</span>
          </div>
          <div className="flex flex-col bg-surface border border-border-subtle rounded-xl p-5">
            <span className="text-[10px] font-semibold tracking-wider text-foreground-muted uppercase mb-1">Overall CAC</span>
            <span className="text-2xl font-medium text-foreground tracking-tight">{formatCurrency(metrics.overallCacCents)}</span>
          </div>
        </div>
      </section>

      {/* Primary Visualization - Trend */}
      <section aria-labelledby="leads-over-time-heading" className="bg-surface border border-border-subtle rounded-xl p-6">
        <header className="mb-5">
          <h2 id="leads-over-time-heading" className="text-base font-semibold text-foreground">
            Leads Over Time
          </h2>
          <p className="text-xs text-foreground-secondary mt-1">Growth of lead generation over time.</p>
        </header>
        <LeadsOverTimeChart data={leadsOverTime} />
      </section>

      {/* Secondary Visualizations (Funnel & Performance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="campaign-performance-heading" className="lg:col-span-2 bg-surface border border-border-subtle rounded-xl p-6">
          <header className="mb-5">
            <h2 id="campaign-performance-heading" className="text-base font-semibold text-foreground">
              Campaign Performance
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Spend versus revenue by campaign.</p>
          </header>
          <CampaignPerformanceChart data={campaigns} />
        </section>

        <section aria-labelledby="pipeline-funnel-heading" className="lg:col-span-1 bg-surface border border-border-subtle rounded-xl p-6 flex flex-col">
          <header className="mb-5">
            <h2 id="pipeline-funnel-heading" className="text-base font-semibold text-foreground">
              Pipeline Funnel
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Lead progression across all campaigns.</p>
          </header>
          <div className="flex-1">
            <PipelineFunnelChart data={funnel} />
          </div>
        </section>
      </div>

      {/* Operational Visualizations (Distribution & Efficiency) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-labelledby="lead-distribution-heading" className="lg:col-span-1 bg-surface border border-border-subtle rounded-xl p-6 flex flex-col">
          <header className="mb-5">
            <h2 id="lead-distribution-heading" className="text-base font-semibold text-foreground">
              Lead Distribution
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Current breakdown of leads by status.</p>
          </header>
          <div className="flex-1">
            <LeadDistributionChart data={leadDistribution} />
          </div>
        </section>

        <section aria-labelledby="campaign-efficiency-heading" className="lg:col-span-2 bg-surface border border-border-subtle rounded-xl p-6 flex flex-col">
          <header className="mb-5">
            <h2 id="campaign-efficiency-heading" className="text-base font-semibold text-foreground">
              Campaign Efficiency
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Spend vs Revenue efficiency mapping.</p>
          </header>
          <div className="flex-1 flex flex-col">
            <CampaignEfficiencyScatter data={campaigns} />
          </div>
        </section>
      </div>

      {/* Strategic Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="experiment-status-heading" className="bg-surface border border-border-subtle rounded-xl p-6">
          <header className="mb-5">
            <h2 id="experiment-status-heading" className="text-base font-semibold text-foreground">
              Experiment Status
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Current state of active and completed experiments.</p>
          </header>
          <div>
            <ExperimentStatusChart data={experimentStatus} />
          </div>
        </section>

        <section aria-labelledby="strategic-volume-heading" className="bg-surface border border-border-subtle rounded-xl p-6">
          <header className="mb-5">
            <h2 id="strategic-volume-heading" className="text-base font-semibold text-foreground">
              Strategic Activity
            </h2>
            <p className="text-xs text-foreground-secondary mt-1">Volume of foundational research and learnings.</p>
          </header>
          <div className="flex items-center">
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
