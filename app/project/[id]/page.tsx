'use client'

import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Loader2 } from 'lucide-react'

import { useProject, useProjectStats } from '@/lib/queries/projects'
import KanbanBoard from '@/components/kanban/Board'
import TodoList from '@/components/sidebar/TodoList'
import NotesEditor from '@/components/notes/NotesEditor'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Skeleton, CardSkeleton, ListSkeleton, BoardSkeleton } from '@/components/ui/skeleton/index'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const { data: project, isLoading, error } = useProject(projectId)
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId)


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 项目头部骨架图 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          {/* 面包屑导航骨架图 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* 标题和描述骨架图 */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>

          {/* 统计卡片骨架图 */}
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-4 space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* 主仪表板布局骨架图 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏骨架图 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <ListSkeleton showHeader={false} showInput={true} itemCount={3} showActions={false} />
              </div>
            </div>
          </div>

          {/* 看板骨架图 */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
              <BoardSkeleton columnCount={3} taskCountPerColumn={2} showHeader={false} />
            </div>
          </div>

          {/* 笔记区域骨架图 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    notFound()
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Project header */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Breadcrumb navigation */}
            <nav className="flex items-center text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
              <Link
                href="/projects"
                className="hover:text-foreground transition-colors hover:underline"
              >
                Projects
              </Link>
              <ChevronRight className="h-3 w-3 mx-2" />
              <span className="text-foreground font-medium truncate" aria-current="page">
                {project.name}
              </span>
            </nav>

            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="mt-2 text-muted-foreground">{project.description}</p>
              )}
            </div>

            {/* Project stats */}
            {!statsLoading && stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-2xl font-bold">{stats.taskCount}</div>
                  <div className="text-sm text-muted-foreground">Tasks</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-2xl font-bold">{stats.todoCount}</div>
                  <div className="text-sm text-muted-foreground">Quick Tasks</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-2xl font-bold">{stats.noteCount}</div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Todo List */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-green" />
                  Quick Tasks
                </h2>
                <TodoList />
              </div>
            </div>
          </div>

          {/* Main Kanban Board */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-neon-cyan" />
                Project Board
                <span className="text-sm font-normal text-muted-foreground">
                  Drag and drop tasks between columns
                </span>
              </h2>
              <KanbanBoard />
            </div>
          </div>

          {/* Notes Area */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-purple" />
                  Notes
                </h2>
                <NotesEditor />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}