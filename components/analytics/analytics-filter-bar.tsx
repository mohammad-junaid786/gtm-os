"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AnalyticsFilters, AvailableFilters } from "@/lib/analytics/types";

export interface AnalyticsFilterBarProps {
  activeFilters: AnalyticsFilters;
  availableFilters: AvailableFilters | null;
  onChange: (filters: AnalyticsFilters) => void;
  onReset: () => void;
}

export function AnalyticsFilterBar({
  activeFilters,
  availableFilters,
  onChange,
  onReset
}: AnalyticsFilterBarProps) {
  const hasActiveFilters = 
    activeFilters.startDate || 
    activeFilters.endDate || 
    activeFilters.leadStatus || 
    activeFilters.campaignId || 
    activeFilters.experimentStatus;

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...activeFilters, startDate: e.target.value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...activeFilters, endDate: e.target.value || undefined });
  };

  const handleLeadStatusChange = (val: string) => {
    onChange({ ...activeFilters, leadStatus: val === "all" ? undefined : val });
  };

  const handleCampaignChange = (val: string) => {
    onChange({ ...activeFilters, campaignId: val === "all" ? undefined : val });
  };

  const handleExperimentStatusChange = (val: string) => {
    onChange({ ...activeFilters, experimentStatus: val === "all" ? undefined : val });
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-4 p-5 rounded-xl bg-primary mb-6 mt-4">
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <div className="flex flex-col gap-1.5 w-full sm:w-36">
          <label className="text-[10px] font-semibold tracking-wider text-primary-foreground/90 uppercase">Start Date</label>
          <Input 
            type="date" 
            className="h-8 text-xs bg-surface border-transparent text-foreground focus-visible:ring-primary-foreground/50" 
            value={activeFilters.startDate || ""} 
            onChange={handleStartDateChange} 
          />
        </div>
        <span className="text-primary-foreground/60 mt-6 text-xs font-medium">—</span>
        <div className="flex flex-col gap-1.5 w-full sm:w-36">
          <label className="text-[10px] font-semibold tracking-wider text-primary-foreground/90 uppercase">End Date</label>
          <Input 
            type="date" 
            className="h-8 text-xs bg-surface border-transparent text-foreground focus-visible:ring-primary-foreground/50" 
            value={activeFilters.endDate || ""} 
            onChange={handleEndDateChange} 
          />
        </div>
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto flex-1 min-w-0 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col gap-1.5 w-full sm:w-36 shrink-0">
          <label className="text-[10px] font-semibold tracking-wider text-primary-foreground/90 uppercase">Lead Status</label>
          <Select 
            value={activeFilters.leadStatus || "all"} 
            onValueChange={handleLeadStatusChange}
            disabled={!availableFilters || availableFilters.leadStatuses.length === 0}
          >
            <SelectTrigger className="h-8 text-xs bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:ring-white/30 w-full data-[placeholder]:text-white/70 [&_svg]:text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {availableFilters?.leadStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0 shrink sm:min-w-[120px] max-w-[220px]">
          <label className="text-[10px] font-semibold tracking-wider text-primary-foreground/90 uppercase truncate">Campaign</label>
          <Select 
            value={activeFilters.campaignId || "all"} 
            onValueChange={handleCampaignChange}
            disabled={!availableFilters || availableFilters.campaigns.length === 0}
          >
            <SelectTrigger className="h-8 text-xs bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:ring-white/30 w-full min-w-0 data-[placeholder]:text-white/70 [&_svg]:text-white">
              <span className="truncate text-left block w-full pr-2">
                <SelectValue placeholder="All Campaigns" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {availableFilters?.campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-36 shrink-0">
          <label className="text-[10px] font-semibold tracking-wider text-primary-foreground/90 uppercase">Experiment</label>
          <Select 
            value={activeFilters.experimentStatus || "all"} 
            onValueChange={handleExperimentStatusChange}
            disabled={!availableFilters || availableFilters.experimentStatuses.length === 0}
          >
            <SelectTrigger className="h-8 text-xs bg-white/10 border border-white/20 text-white hover:bg-white/20 focus:ring-white/30 w-full data-[placeholder]:text-white/70 [&_svg]:text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {availableFilters?.experimentStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end h-full mt-2 lg:mt-0 shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="h-8 text-xs bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:text-white px-4 disabled:opacity-50"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
