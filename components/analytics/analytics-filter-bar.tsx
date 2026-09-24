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
    <div className="flex flex-col md:flex-row items-center gap-4 p-4 border border-border rounded-lg bg-surface mb-8">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex flex-col gap-1 w-full md:w-32">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Start Date</label>
          <Input 
            type="date" 
            className="h-9 text-sm" 
            value={activeFilters.startDate || ""} 
            onChange={handleStartDateChange} 
          />
        </div>
        <span className="text-muted-foreground mt-4">-</span>
        <div className="flex flex-col gap-1 w-full md:w-32">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">End Date</label>
          <Input 
            type="date" 
            className="h-9 text-sm" 
            value={activeFilters.endDate || ""} 
            onChange={handleEndDateChange} 
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto flex-1 flex-wrap">
        <div className="flex flex-col gap-1 w-full sm:w-40">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Lead Status</label>
          <Select 
            value={activeFilters.leadStatus || "all"} 
            onValueChange={handleLeadStatusChange}
            disabled={!availableFilters || availableFilters.leadStatuses.length === 0}
          >
            <SelectTrigger className="h-9">
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

        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Campaign</label>
          <Select 
            value={activeFilters.campaignId || "all"} 
            onValueChange={handleCampaignChange}
            disabled={!availableFilters || availableFilters.campaigns.length === 0}
          >
            <SelectTrigger className="h-9 truncate">
              <SelectValue placeholder="All Campaigns" />
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

        <div className="flex flex-col gap-1 w-full sm:w-40">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Experiment Status</label>
          <Select 
            value={activeFilters.experimentStatus || "all"} 
            onValueChange={handleExperimentStatusChange}
            disabled={!availableFilters || availableFilters.experimentStatuses.length === 0}
          >
            <SelectTrigger className="h-9">
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

      <div className="flex items-end h-full mt-4 md:mt-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="h-9 shrink-0"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
