import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface CardSkeletonProps {
  className?: string
  showDescription?: boolean
  showStats?: boolean
  showFooter?: boolean
}

export function CardSkeleton({
  className,
  showDescription = true,
  showStats = true,
  showFooter = true,
}: CardSkeletonProps) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            {showDescription && (
              <Skeleton className="h-4 w-full" />
            )}
          </div>

          {/* 统计信息 */}
          {showStats && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          )}

          {/* 底部信息 */}
          {showFooter && (
            <div className="pt-2">
              <Skeleton className="h-3 w-32" />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}