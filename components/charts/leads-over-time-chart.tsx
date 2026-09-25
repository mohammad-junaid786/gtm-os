"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export interface LeadsOverTimeChartProps {
  data: { period: string; count: number }[];
}

export function LeadsOverTimeChart({ data }: LeadsOverTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 p-6 text-center h-72 w-full">
        <p className="text-sm font-medium text-foreground">No lead activity over time yet</p>
        <p className="text-xs text-foreground-secondary mt-1">
          Historical lead data will appear here as your pipeline grows.
        </p>
      </div>
    );
  }

  const formatPeriod = (period: string) => {
    try {
      const [year, month] = period.split('-');
      if (!year || !month) return period;
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    } catch {
      return period;
    }
  };

  return (
    <div className="w-full h-72 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.4} />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
            tickFormatter={formatPeriod}
            dy={10}
            minTickGap={30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-subtle)", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              fontSize: "12px",
              padding: "8px 12px",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)"
            }}
            labelStyle={{ color: "var(--foreground-muted)", marginBottom: "4px" }}
            labelFormatter={(label) => formatPeriod(label as string)}
            formatter={(value: number) => [value, "Leads"]}
            itemStyle={{ fontWeight: 500, color: "var(--primary)" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--primary)" }}
            dot={data.length === 1 ? { r: 4, strokeWidth: 0, fill: "var(--primary)" } : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
