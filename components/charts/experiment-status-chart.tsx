"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export interface ExperimentStatusChartProps {
  data: { status: string; count: number }[];
}

export function ExperimentStatusChart({ data }: ExperimentStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No experiments yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Launch experiments to see their status distribution here.
        </p>
      </div>
    );
  }

  // Format statuses for display (e.g., 'in_progress' -> 'In Progress')
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const chartData = data.map(item => ({
    ...item,
    displayName: formatStatus(item.status)
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="displayName" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
            width={90}
          />
          <Tooltip 
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{ 
              borderRadius: '6px', 
              border: '1px solid var(--border)', 
              boxShadow: 'none', 
              fontSize: '12px', 
              padding: '8px 12px', 
              backgroundColor: 'var(--background)', 
              color: 'var(--foreground)' 
            }}
            formatter={(value: number) => [value, "Experiments"]}
            itemStyle={{ fontWeight: 500, color: "var(--foreground)" }}
          />
          <Bar dataKey="count" fill="var(--primary)" radius={[0, 2, 2, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
