import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface FormSkeletonProps {
  className?: string
  showTitle?: boolean
  showDescription?: boolean
  fieldCount?: number
  showActions?: boolean
  showSocialLogin?: boolean
  showFooter?: boolean
}

export function FormSkeleton({
  className,
  showTitle = true,
  showDescription = true,
  fieldCount = 2,
  showActions = true,
  showSocialLogin = true,
  showFooter = true,
}: FormSkeletonProps) {
  return (
    <div
      data-slot="form-skeleton"
      className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
    >
      {/* 标题区域 */}
      {showTitle && (
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-1/3" />
          {showDescription && (
            <Skeleton className="h-4 w-2/3" />
          )}
        </div>
      )}

      {/* 表单字段 */}
      <div className="space-y-4">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* 表单操作按钮 */}
      {showActions && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />

          {/* 社交登录分隔线 */}
          {showSocialLogin && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Skeleton className="h-px w-full" />
                </div>
                <div className="relative flex justify-center">
                  <Skeleton className="h-5 w-24 bg-card" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </>
          )}
        </div>
      )}

      {/* 底部链接 */}
      {showFooter && (
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      )}
    </div>
  )
}