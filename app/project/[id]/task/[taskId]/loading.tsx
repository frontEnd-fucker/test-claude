import { Skeleton } from '@/components/ui/skeleton'

export default function TaskDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}