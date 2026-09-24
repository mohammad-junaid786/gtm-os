"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis
} from "recharts";

export interface CampaignEfficiencyScatterProps {
  data: { name: string; spend: number; revenue: number }[];
}

export function CampaignEfficiencyScatter({ data }: CampaignEfficiencyScatterProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No campaign performance data yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Run campaigns and track spend/revenue to see performance.
        </p>
      </div>
    );
  }

  const formatCurrency = (cents: number | null, compact = false) => {
    if (cents === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(cents / 100);
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            type="number" 
            dataKey="spend" 
            name="Spend" 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => formatCurrency(val, true)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            type="number" 
            dataKey="revenue" 
            name="Revenue" 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => formatCurrency(val, true)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            dx={-10}
          />
          <ZAxis type="category" dataKey="name" name="Campaign" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--border)' }}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid var(--border)",
              boxShadow: "none",
              fontSize: "12px",
              padding: "8px 12px",
              backgroundColor: "var(--background)",
              color: "var(--foreground)"
            }}
            itemStyle={{ fontWeight: 500 }}
            formatter={(value: string | number, name: string) => {
              if (name === "Spend" || name === "Revenue") {
                return [formatCurrency(value as number), name];
              }
              return [value, name];
            }}
          />
          <Scatter 
            name="Campaigns" 
            data={data} 
            fill="var(--primary)" 
            fillOpacity={0.6}
            stroke="var(--primary)"
            strokeWidth={2}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
