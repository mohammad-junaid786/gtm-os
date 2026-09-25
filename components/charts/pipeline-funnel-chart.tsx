"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { PipelineFunnel } from "@/lib/analytics/types";

export function PipelineFunnelChart({ data }: { data: PipelineFunnel[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 text-sm text-foreground-secondary p-6 text-center">
        <p className="font-medium text-foreground">No pipeline data</p>
        <p className="mt-1">Add leads to see your pipeline progression.</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" opacity={0.5} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="status" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--foreground-muted)", fontSize: 12 }} 
            width={90}
          />
          <Tooltip 
            cursor={{ fill: "var(--surface-subtle)", opacity: 0.4 }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '12px', padding: '8px 12px' }}
            itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
          />
          <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={24} name="Leads" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
