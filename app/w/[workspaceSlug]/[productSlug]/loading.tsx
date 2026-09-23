import { Loader2 } from "lucide-react";

export default function ProductRouteLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
