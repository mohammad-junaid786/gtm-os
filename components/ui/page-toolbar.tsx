import * as React from "react";
import { cn } from "@/lib/utils";

interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content for the left side of the toolbar (e.g., search, filters, tabs)
   */
  start?: React.ReactNode;
  
  /**
   * Content for the right side of the toolbar (e.g., primary action buttons)
   */
  end?: React.ReactNode;
}

export function PageToolbar({ start, end, className, ...props }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 items-center flex-wrap gap-2">
        {start}
      </div>
      <div className="flex items-center gap-2">
        {end}
      </div>
    </div>
  );
}
