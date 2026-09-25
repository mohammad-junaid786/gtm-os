"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell
} from "recharts";

export interface CampaignEfficiencyScatterProps {
  data: { name: string; spend: number; revenue: number }[];
}

export function CampaignEfficiencyScatter({ data }: CampaignEfficiencyScatterProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 p-6 text-center h-72 w-full">
        <p className="text-sm font-medium text-foreground">No campaign performance data yet</p>
        <p className="text-xs text-foreground-secondary mt-1">
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
    <div className="w-full mt-2 flex-1 relative min-h-[250px]">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} />
            <XAxis 
              type="number" 
              dataKey="spend" 
              name="Spend" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatCurrency(val, true)}
              tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
              dy={10}
              label={{ value: 'Spend', position: 'bottom', fill: 'var(--foreground-muted)', fontSize: 11, offset: 0 }}
            />
            <YAxis 
              type="number" 
              dataKey="revenue" 
              name="Revenue" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatCurrency(val, true)}
              tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
              dx={-10}
              width={50}
              label={{ value: 'Revenue', angle: -90, position: 'insideLeft', fill: 'var(--foreground-muted)', fontSize: 11, offset: -5 }}
            />
            <ZAxis type="category" dataKey="name" name="Campaign" range={[100, 100]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-subtle)' }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                fontSize: "12px",
                padding: "10px 14px",
                backgroundColor: "var(--surface)",
                color: "var(--foreground)"
              }}
              itemStyle={{ fontWeight: 500 }}
              labelStyle={{ color: "var(--foreground-muted)", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}
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
              fillOpacity={0.8}
              strokeWidth={1.5}
              stroke="var(--surface)"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--primary)" />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
