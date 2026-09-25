"use client";

import { CheckCircle2, PlayCircle, PauseCircle, XCircle } from "lucide-react";

export interface ExperimentStatusChartProps {
  data: { status: string; count: number }[];
}

export function ExperimentStatusChart({ data }: ExperimentStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 p-6 text-center min-h-[160px]">
        <p className="text-sm font-medium text-foreground">No experiments yet</p>
        <p className="text-xs text-foreground-secondary mt-1">
          Launch experiments to see their status here.
        </p>
      </div>
    );
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4 text-primary" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-foreground-muted" />;
    }
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full flex flex-col gap-4 py-1">
      <div className="flex items-center justify-between text-xs pb-2 border-b border-border-subtle/50">
        <span className="font-medium text-foreground-muted uppercase tracking-wider">Status</span>
        <span className="font-medium text-foreground-muted uppercase tracking-wider">Experiments</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {data.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.status} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm text-foreground">{formatStatus(item.status)}</span>
                </div>
                <span className="text-sm font-medium text-foreground tabular-nums">{item.count}</span>
              </div>
              {/* Very subtle background track for magnitude */}
              <div className="w-full h-1 bg-surface-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-border-strong rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
