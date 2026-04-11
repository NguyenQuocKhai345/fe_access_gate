import { Loader2 } from "lucide-react";

export const RouteLoading = () => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading page...</span>
    </div>
  );
};
