"use client";

export interface StrategicVolumeChartProps {
  data: { totalLearnings: number; totalResearchItems: number } | null;
}

export function StrategicVolumeChart({ data }: StrategicVolumeChartProps) {
  if (!data || (data.totalLearnings === 0 && data.totalResearchItems === 0)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-md bg-surface/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No strategic activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Record learnings and research to track strategic volume.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(data.totalLearnings, data.totalResearchItems, 1); // Avoid division by zero
  const learningsPercent = (data.totalLearnings / maxVal) * 100;
  const researchPercent = (data.totalResearchItems / maxVal) * 100;

  return (
    <div className="h-72 w-full flex flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">Learnings</span>
          <span className="font-semibold text-primary">{data.totalLearnings}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${learningsPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">Research Items</span>
          <span className="font-semibold text-primary">{data.totalResearchItems}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/70 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${researchPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
