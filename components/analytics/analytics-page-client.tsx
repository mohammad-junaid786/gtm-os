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
    <div className="space-y-8 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Analytics & Measurement
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Performance metrics for your go-to-market execution.
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-neutral-900">Pipeline Funnel</h2>
          {funnel.length === 0 ? (
            <div className="h-64 flex items-center justify-center border border-neutral-200 rounded-lg bg-neutral-50 text-sm text-neutral-500">
              No lead data available.
            </div>
          ) : (
            <div className="h-64 p-4 border border-neutral-200 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="status" type="category" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f5f5f5" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-neutral-900">Campaign Performance</h2>
          {campaigns.length === 0 ? (
            <div className="h-64 flex items-center justify-center border border-neutral-200 rounded-lg bg-neutral-50 text-sm text-neutral-500">
              No campaign data available.
            </div>
          ) : (
            <div className="h-64 p-4 border border-neutral-200 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaigns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: "#f5f5f5" }} 
                    formatter={(val: number, name: string) => [formatCurrency(val), name === "revenue" ? "Revenue" : "Spend"]}
                  />
                  <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spend" />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
