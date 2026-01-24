import * as React from "react"
import { cn } from "@/lib/utils"

function MinimalSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="minimal-skeleton"
      className={cn("rounded-md bg-muted/30", className)}
      {...props}
    />
  )
}

export { MinimalSkeleton }