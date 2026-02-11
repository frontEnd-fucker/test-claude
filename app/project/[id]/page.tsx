"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";

import { useProject, useProjectStats } from "@/lib/queries/projects";
import { isTempId } from "@/types";
import KanbanBoard from "@/components/kanban/Board";
import TodoList from "@/components/sidebar/TodoList";
import NotesEditor from "@/components/notes/NotesEditor";
import ProjectMembers from "@/components/project/ProjectMembers";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  BoardSkeleton,
  MinimalSkeleton,
} from "@/components/ui/skeleton/index";


export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId);

  if (isTempId(projectId)) {
    return (
      <div className="space-y-6">
        {/* 项目头部 */}
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
              <span
                className="text-foreground font-medium truncate"
                aria-current="page"
              >
                Creating project...
              </span>
            </nav>

            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Creating project...</h2>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Please wait while the project is being created. This page will refresh automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 项目头部 - 极简骨架图 */}
        <MinimalSkeleton className="h-28 rounded-xl" />

        {/* 主仪表板布局骨架图 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 - 极简骨架图 */}
          <div className="lg:col-span-1">
            <MinimalSkeleton className="h-[500px] rounded-xl sticky top-16" />
          </div>

          {/* 看板区域 - 保持详细骨架图 */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
              <BoardSkeleton
                columnCount={3}
                taskCountPerColumn={2}
                showHeader={false}
              />
            </div>
          </div>

          {/* 笔记区域 - 极简骨架图 */}
          <div className="lg:col-span-1">
            <MinimalSkeleton className="h-[500px] rounded-xl sticky top-16" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    notFound();
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Project header - simplified */}
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
              <span
                data-testid="project-title"
                className="text-foreground font-medium truncate"
                aria-current="page"
              >
                {project.name}
              </span>
            </nav>

            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            {/* Members section */}
            <div className="mt-4 pt-4 border-t">
              <ProjectMembers projectId={projectId} compact />
            </div>
          </div>
        </div>

        {/* Main dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Todo List */}
          <div className="lg:col-span-1">
            <div className="sticky top-16">
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
            <div className="sticky top-16">
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
  );
}
