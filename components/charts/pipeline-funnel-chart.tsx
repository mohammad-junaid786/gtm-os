"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { PipelineFunnel } from "@/lib/analytics/types";

export function PipelineFunnelChart({ data }: { data: PipelineFunnel[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 text-sm text-foreground-secondary p-6 text-center min-h-[200px]">
        <p className="font-medium text-foreground">No pipeline data</p>
        <p className="mt-1">Add leads to see your pipeline progression.</p>
      </div>
    );
  }

  // Calculate dynamic height based on data
  const calculatedHeight = Math.max(200, data.length * 45 + 20);

  return (
    <div className="w-full mt-2" style={{ height: `${calculatedHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="status" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }} 
            width={90}
            tickFormatter={(val: string) => val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
          <Tooltip 
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.4 }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px', padding: '8px 12px', backgroundColor: 'var(--surface)' }}
            itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
            labelStyle={{ color: 'var(--foreground-muted)', marginBottom: '4px' }}
            formatter={(val: number) => [val, "Leads"]}
            labelFormatter={(label: string) => label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} name="Leads">
            {data.map((entry, index) => {
              // Fade the bars as we go down the funnel or use primary
              // Let's use a solid primary but we could vary opacity
              const opacity = Math.max(0.4, 1 - (index * 0.15));
              return <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
