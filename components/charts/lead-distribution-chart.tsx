"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export interface LeadDistributionChartProps {
  data: { status: string; count: number }[];
}

export function LeadDistributionChart({ data }: LeadDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 p-6 text-center h-64 w-full">
        <p className="text-sm font-medium text-foreground">No lead distribution data yet</p>
        <p className="text-xs text-foreground-secondary mt-1">
          Historical lead data will appear here as your pipeline grows.
        </p>
      </div>
    );
  }

  // Coordinated blue monochromatic palette
  const COLORS = [
    "#0562EF", // Primary GTM blue
    "#1d4ed8", // Strong blue
    "#3b82f6", // Medium blue
    "#60a5fa", // Soft blue
    "#64748b", // Muted blue/slate
    "#94a3b8"  // Pale blue/slate
  ];

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="@container w-full h-full min-h-[280px] flex items-center justify-center py-6">
      <div className="flex flex-col @md:flex-row items-center justify-center w-full gap-8 @md:gap-12 px-4 @sm:px-6">
        
        {/* Donut Container - Size adapts to container width */}
        <div className="relative shrink-0 w-[170px] h-[170px] @sm:w-[185px] @sm:h-[185px] @md:w-[200px] @md:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="90%"
                stroke="var(--surface)"
                strokeWidth={3}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              
              {/* Center text */}
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="600" fill="var(--foreground)">
                  {total}
                </tspan>
                <tspan x="50%" dy="1.5em" fontSize="11" fill="var(--foreground-muted)" fontWeight="500" letterSpacing="0.05em">
                  TOTAL
                </tspan>
              </text>

              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  padding: "8px 12px",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)"
                }}
                itemStyle={{ fontWeight: 500 }}
                formatter={(value: number) => [value, "Leads"]}
                labelFormatter={(label) => typeof label === 'string' ? label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : label}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Container */}
        <div className="w-full @md:w-auto @md:flex-1 flex justify-center @md:justify-start">
          <ul className="flex flex-col gap-3 w-full max-w-[320px]">
            {data.map((entry, index) => {
              const count = entry.count;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              const labelStr = entry.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              
              return (
                <li key={`item-${index}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[13px] w-full">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-foreground-secondary">{labelStr}</span>
                  <span className="font-medium text-foreground text-right">{percent}%</span>
                </li>
              );
            })}
          </ul>
        </div>
        
      </div>
    </div>
  );
}
