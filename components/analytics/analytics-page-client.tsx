"use client";

import { useEffect, useState, useTransition } from "react";
import { useProductContext } from "@/lib/product-context";
import {
  loadGtmMetricsAction,
  loadPipelineFunnelAction,
  loadCampaignPerformanceAction,
} from "@/lib/analytics/actions";
import type { GtmMetrics, PipelineFunnel, CampaignPerformance } from "@/lib/analytics/types";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function AnalyticsPageClient() {
  const { productId } = useProductContext();
  const [isPending, startTransition] = useTransition();

  const [metrics, setMetrics] = useState<GtmMetrics | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnel[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const [metricsRes, funnelRes, campaignsRes] = await Promise.all([
          loadGtmMetricsAction(productId),
          loadPipelineFunnelAction(productId),
          loadCampaignPerformanceAction(productId),
        ]);

        if (metricsRes.ok && funnelRes.ok && campaignsRes.ok) {
          setMetrics(metricsRes.data);
          setFunnel(funnelRes.data);
          setCampaigns(campaignsRes.data);
        } else {
          setError("Failed to load analytics data.");
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoaded(true);
      }
    });
  }, [productId]);

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

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-12 max-w-6xl">
      <PageHeader
        eyebrow="MEASUREMENT"
        title="Analytics & Measurement"
        description="Performance metrics for your go-to-market execution."
      />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <section aria-labelledby="pipeline-funnel-heading">
          <h2 id="pipeline-funnel-heading" className="text-sm font-semibold text-foreground">
            Pipeline Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Lead progression across all campaigns.</p>
          {funnel.length === 0 ? (
            <div className="h-64 flex items-center justify-center mt-6 border border-dashed border-border rounded-md bg-surface/50 text-sm text-muted-foreground">
              No lead data available.
            </div>
          ) : (
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="status" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6b6b6b", fontSize: 12 }} 
                    width={90}
                  />
                  <Tooltip 
                    cursor={{ fill: "#f0f0f0", opacity: 0.4 }}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #dbdbdb', boxShadow: 'none', fontSize: '12px', padding: '8px 12px' }}
                    itemStyle={{ color: '#212121', fontWeight: 500 }}
                  />
                  <Bar dataKey="count" fill="#0562ef" radius={[0, 2, 2, 0]} barSize={20} />
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
            <div className="h-64 flex items-center justify-center mt-6 border border-dashed border-border rounded-md bg-surface/50 text-sm text-muted-foreground">
              No campaign data available.
            </div>
          ) : (
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaigns} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6b6b6b", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: "#f0f0f0", opacity: 0.4 }} 
                    contentStyle={{ borderRadius: '6px', border: '1px solid #dbdbdb', boxShadow: 'none', fontSize: '12px', padding: '8px 12px' }}
                    formatter={(val: number, name: string) => [formatCurrency(val), name === "revenue" ? "Revenue" : "Spend"]}
                    itemStyle={{ fontWeight: 500 }}
                  />
                  <Bar dataKey="spend" fill="#a3a3a3" radius={[2, 2, 0, 0]} name="Spend" barSize={16} />
                  <Bar dataKey="revenue" fill="#0562ef" radius={[2, 2, 0, 0]} name="Revenue" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
