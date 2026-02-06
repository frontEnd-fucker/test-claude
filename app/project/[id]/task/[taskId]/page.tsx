'use client'

import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { useTaskDetail } from '@/lib/queries/tasks'
import { useProject } from '@/lib/queries/projects'
import { AuthGuard } from '@/components/auth/AuthGuard'
import TaskDetailHeader from '@/components/task-detail/TaskDetailHeader'
import TaskDescriptionEditor from '@/components/task-detail/TaskDescriptionEditor'
import TaskAttributesSidebar from '@/components/task-detail/TaskAttributesSidebar'
import { CommentsSection } from '@/components/comments'
import { Skeleton } from '@/components/ui/skeleton'

export default function TaskDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const taskId = params.taskId as string

  const { data: task, isLoading: taskLoading, error: taskError } = useTaskDetail(taskId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  if (taskLoading || projectLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
      </AuthGuard>
    )
  }

  if (taskError || !task) {
    notFound()
  }

  if (!project) {
    notFound()
  }

  // Verify task belongs to project
  if (task.projectId !== projectId) {
    notFound()
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {project.name}
          </Link>
        </div>

        {/* Task detail content */}
        <div className="space-y-8">
          <TaskDetailHeader task={task} project={project} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content - description */}
            <div className="lg:col-span-2">
              <TaskDescriptionEditor task={task} />

              {/* Comments section */}
              <div className="mt-8">
                <CommentsSection taskId={task.id} />
              </div>
            </div>

            {/* Sidebar - attributes */}
            <div>
              <TaskAttributesSidebar task={task} projectId={projectId} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}