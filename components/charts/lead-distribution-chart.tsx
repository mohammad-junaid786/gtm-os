"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export interface LeadDistributionChartProps {
  data: { status: string; count: number }[];
}

export function LeadDistributionChart({ data }: LeadDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No lead distribution data yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Historical lead data will appear here as your pipeline grows.
        </p>
      </div>
    );
  }

  // Use existing GTM OS design tokens for a restrained, coherent palette
  const COLORS = [
    "var(--primary)",
    "var(--ring)",
    "var(--muted-foreground)",
    "var(--foreground)",
    "var(--border)"
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            stroke="var(--background)"
            strokeWidth={2}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip
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
            formatter={(value: number) => [value, "Leads"]}
          />
          <Legend 
            content={(props) => {
              const { payload } = props;
              const total = data.reduce((acc, curr) => acc + curr.count, 0);
              return (
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                  {payload?.map((entry, index) => {
                    const count = data.find(d => d.status === entry.value)?.count || 0;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <li key={`item-${index}`} className="flex items-center text-xs text-muted-foreground">
                        <span 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="capitalize mr-1">{entry.value}</span>
                        <span className="font-medium text-foreground">{percent}%</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
