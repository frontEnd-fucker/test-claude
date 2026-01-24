import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ListSkeletonProps {
  className?: string
  showHeader?: boolean
  showInput?: boolean
  itemCount?: number
  showActions?: boolean
}

export function ListSkeleton({
  className,
  showHeader = true,
  showInput = true,
  itemCount = 3,
  showActions = true,
}: ListSkeletonProps) {
  return (
    <div
      data-slot="list-skeleton"
      className={cn("space-y-4", className)}
    >
      {/* 头部 */}
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* 输入区域 */}
      {showInput && (
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      )}

      {/* 列表项 */}
      <div className="space-y-3">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-5 w-5 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            {showActions && (
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      {showActions && (
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  )
}