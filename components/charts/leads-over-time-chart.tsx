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
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No lead activity over time yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Historical lead data will appear here as your pipeline grows.
        </p>
      </div>
    );
  }

  // Convert 'YYYY-MM' to a more readable format 'MMM YYYY' for tooltip if desired,
  // or just rely on standard string representation.
  const formatPeriod = (period: string) => {
    try {
      // Period is expected as '2026-01'
      const [year, month] = period.split('-');
      if (!year || !month) return period;
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    } catch {
      return period;
    }
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={formatPeriod}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid var(--border)",
              boxShadow: "none",
              fontSize: "12px",
              padding: "8px 12px",
              backgroundColor: "var(--background)",
              color: "var(--foreground)"
            }}
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
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--primary)" }}
            dot={data.length === 1 ? { r: 4, strokeWidth: 0, fill: "var(--primary)" } : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
