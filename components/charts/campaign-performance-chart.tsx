"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { CampaignPerformance } from "@/lib/analytics/types";

const CustomizedAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (x === undefined || y === undefined || !payload) return null;
  const name = payload.value;
  
  let line1 = name;
  let line2 = "";
  
  if (name.length > 14 && name.includes(' ')) {
    const words = name.split(' ');
    const midpoint = Math.ceil(words.length / 2);
    
    line1 = words.slice(0, midpoint).join(' ');
    line2 = words.slice(midpoint).join(' ');
    
    if (line1.length > 20) line1 = line1.substring(0, 18) + '...';
    if (line2.length > 20) line2 = line2.substring(0, 18) + '...';
  } else if (name.length > 20) {
    line1 = name.substring(0, 18) + '...';
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={0} textAnchor="middle" dominantBaseline="hanging" fill="var(--foreground-muted)" fontSize={11}>
        <tspan x="0" dy="0">{line1}</tspan>
        {line2 && <tspan x="0" dy="16">{line2}</tspan>}
      </text>
    </g>
  );
};

export function CampaignPerformanceChart({ data }: { data: CampaignPerformance[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 text-sm text-foreground-secondary p-6 text-center min-h-[240px]">
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

  const formatCompact = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      compactDisplay: "short"
    }).format(cents / 100);
  };

  return (
    <div className="w-full mt-2 overflow-hidden rounded-b-xl border-t-0">
      <div className="w-full h-[320px] overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="min-w-[600px] h-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                height={60}
                tickMargin={14}
                tick={<CustomizedAxisTick />}
              />
              <YAxis 
                type="number" 
                axisLine={false} 
                tickLine={false}
                tickFormatter={formatCompact}
                tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                width={60}
              />
              <Tooltip 
                cursor={{ fill: "var(--surface-subtle)", opacity: 0.4 }} 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px', padding: '10px 14px', backgroundColor: 'var(--surface)' }}
                formatter={(val: number, name: string) => [formatCurrency(val), name]}
                labelStyle={{ color: "var(--foreground-muted)", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}
                itemStyle={{ fontWeight: 500 }}
              />
              <Legend 
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                iconType="circle"
              />
              <Bar dataKey="spend" fill="var(--foreground-muted)" opacity={0.7} radius={[4, 4, 0, 0]} name="Spend" barSize={16} />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Revenue" barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
