import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Please wait while we verify your session.
          </p>
        </div>
      </div>
    </div>
  );
}
