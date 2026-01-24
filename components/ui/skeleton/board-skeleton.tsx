import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface BoardSkeletonProps {
  className?: string
  columnCount?: number
  taskCountPerColumn?: number
  showHeader?: boolean
}

export function BoardSkeleton({
  className,
  columnCount = 3,
  taskCountPerColumn = 2,
  showHeader = true,
}: BoardSkeletonProps) {
  return (
    <div
      data-slot="board-skeleton"
      className={cn("space-y-6", className)}
    >
      {/* 头部操作区域 */}
      {showHeader && (
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {/* 看板列网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="rounded-lg border bg-card p-4 space-y-4"
          >
            {/* 列标题 */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            {/* 列内容 - 任务卡片 */}
            <div className="space-y-3">
              {Array.from({ length: taskCountPerColumn }).map((_, taskIndex) => (
                <div
                  key={taskIndex}
                  className="rounded-md border bg-background p-3 space-y-3"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* 添加任务按钮 */}
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}