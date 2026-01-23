'use client'

import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { ChevronRight, Loader2 } from 'lucide-react'

import { useProject, useProjectStats } from '@/lib/queries/projects'
import KanbanBoard from '@/components/kanban/Board'
import TodoList from '@/components/sidebar/TodoList'
import NotesEditor from '@/components/notes/NotesEditor'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useKanbanStore } from '@/lib/store/kanban-store'
import { useTodoStore } from '@/lib/store/todo-store'
import { useNotesStore } from '@/lib/store/notes-store'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const { data: project, isLoading, error } = useProject(projectId)
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId)

  // Sync project ID to all stores
  const setKanbanProject = useKanbanStore(state => state.setSelectedProjectId)
  const setTodoProject = useTodoStore(state => state.setSelectedProjectId)
  const setNotesProject = useNotesStore(state => state.setSelectedProjectId)

  useEffect(() => {
    if (projectId) {
      setKanbanProject(projectId)
      setTodoProject(projectId)
      setNotesProject(projectId)
    }
    return () => {
      setKanbanProject(null)
      setTodoProject(null)
      setNotesProject(null)
    }
  }, [projectId, setKanbanProject, setTodoProject, setNotesProject])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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