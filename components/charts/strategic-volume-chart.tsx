"use client";

export interface StrategicVolumeChartProps {
  data: { totalLearnings: number; totalResearchItems: number } | null;
}

export function StrategicVolumeChart({ data }: StrategicVolumeChartProps) {
  if (!data || (data.totalLearnings === 0 && data.totalResearchItems === 0)) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl bg-surface-subtle/50 p-6 text-center min-h-[160px] w-full">
        <p className="text-sm font-medium text-foreground">No strategic activity yet</p>
        <p className="text-xs text-foreground-secondary mt-1">
          Record learnings and research to track strategic volume.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(data.totalLearnings, data.totalResearchItems, 1); // Avoid division by zero
  const learningsPercent = (data.totalLearnings / maxVal) * 100;
  const researchPercent = (data.totalResearchItems / maxVal) * 100;

  return (
    <div className="w-full flex flex-col justify-center gap-7 py-2 px-1">
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Learnings</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{data.totalLearnings}</span>
        </div>
        <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${learningsPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Research Items</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{data.totalResearchItems}</span>
        </div>
        <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground-muted rounded-full transition-all duration-500 ease-out"
            style={{ width: `${researchPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
