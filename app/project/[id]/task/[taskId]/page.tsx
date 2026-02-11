'use client'

import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react'

import { useTaskDetail } from '@/lib/queries/tasks'
import { useProject } from '@/lib/queries/projects'
import { AuthGuard } from '@/components/auth/AuthGuard'
import TaskDetailHeader from '@/components/task-detail/TaskDetailHeader'
import TaskDescriptionEditor from '@/components/task-detail/TaskDescriptionEditor'
import TaskAttributesSidebar from '@/components/task-detail/TaskAttributesSidebar'
import { CommentsSection } from '@/components/comments'
import { Skeleton } from '@/components/ui/skeleton'
import { isTempId } from '@/types'


export default function TaskDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const taskId = params.taskId as string

  const { data: task, isLoading: taskLoading, error: taskError } = useTaskDetail(taskId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  if (isTempId(taskId)) {
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
              Back to project
            </Link>
          </div>

          <div className="space-y-6">
            {/* Task header */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {/* Breadcrumb navigation */}
                <nav
                  className="flex items-center text-sm text-muted-foreground"
                  aria-label="Breadcrumb"
                >
                  <Link
                    href="/projects"
                    className="hover:text-foreground transition-colors hover:underline"
                  >
                    Projects
                  </Link>
                  <ChevronRight className="h-3 w-3 mx-2" />
                  <Link
                    href={`/project/${projectId}`}
                    className="hover:text-foreground transition-colors hover:underline"
                  >
                    Project
                  </Link>
                  <ChevronRight className="h-3 w-3 mx-2" />
                  <span
                    className="text-foreground font-medium truncate"
                    aria-current="page"
                  >
                    Creating task...
                  </span>
                </nav>

                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Creating task...</h2>
                      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                        Please wait while the task is being created. This page will refresh automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

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
                <CommentsSection taskId={task.id} projectId={projectId} />
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