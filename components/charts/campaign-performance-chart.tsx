"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { CampaignPerformance } from "@/lib/analytics/types";

export function CampaignPerformanceChart({ data }: { data: CampaignPerformance[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 text-sm text-foreground-secondary p-6 text-center">
        <p className="font-medium text-foreground">No campaign data</p>
        <p className="mt-1">Add campaigns to see performance metrics.</p>
      </div>
    );
  }

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--foreground-muted)", fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            hide 
          />
          <Tooltip 
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.4 }} 
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '12px', padding: '8px 12px' }}
            formatter={(val: number, name: string) => [formatCurrency(val), name === "revenue" ? "Revenue" : "Spend"]}
            itemStyle={{ fontWeight: 500 }}
          />
          <Bar dataKey="spend" fill="var(--foreground-muted)" opacity={0.5} radius={[4, 4, 0, 0]} name="Spend" barSize={20} />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Revenue" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
