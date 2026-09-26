import * as React from "react";
import { cn } from "@/lib/utils";

const DescriptionList = React.forwardRef<
  HTMLDListElement,
  React.HTMLAttributes<HTMLDListElement>
>(({ className, ...props }, ref) => (
  <dl
    ref={ref}
    className={cn("grid gap-6 sm:grid-cols-2", className)}
    {...props}
  />
));
DescriptionList.displayName = "DescriptionList";

const DescriptionListItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props} />
));
DescriptionListItem.displayName = "DescriptionListItem";

const DescriptionListTerm = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <dt
    ref={ref}
    className={cn(
      "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
    {...props}
  />
));
DescriptionListTerm.displayName = "DescriptionListTerm";

const DescriptionListDetails = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <dd
    ref={ref}
    className={cn("text-sm text-foreground leading-relaxed", className)}
    {...props}
  />
));
DescriptionListDetails.displayName = "DescriptionListDetails";

export {
  DescriptionList,
  DescriptionListItem,
  DescriptionListTerm,
  DescriptionListDetails,
};
