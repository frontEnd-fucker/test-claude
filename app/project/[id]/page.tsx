"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { isTempId } from "@/types";
import KanbanBoard from "@/components/kanban/Board";
import TodoList from "@/components/sidebar/TodoList";
import NotesEditor from "@/components/notes/NotesEditor";
import { AITaskInput } from "@/components/ai";
import { AuthGuard } from "@/components/auth/AuthGuard";
import ProjectTimeline from "@/components/timeline/ProjectTimeline";
import ProjectHeader from "@/components/project/ProjectHeader";


export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

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
              <a
                href="/projects"
                className="hover:text-foreground transition-colors hover:underline"
              >
                Projects
              </a>
              <Loader2 className="h-3 w-3 mx-2 animate-spin" />
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

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Project Header - 组件自己处理骨架屏 */}
        <ProjectHeader projectId={projectId} />

        {/* Project Timeline - 组件自己处理骨架屏 */}
        <ProjectTimeline projectId={projectId} />

        {/* Main dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Quick Tasks & Notes */}
          <div className="lg:col-span-1">
            <div className="sticky top-16 space-y-4">
              {/* Quick Tasks */}
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-green" />
                  Quick Tasks
                </h2>
                <TodoList />
              </div>

              {/* Notes */}
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-purple" />
                  Notes
                </h2>
                <NotesEditor />
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

          {/* AI Task Split Area */}
          <div className="lg:col-span-1">
            <div className="sticky top-16">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-green" />
                  AI Task Split
                </h2>
                <AITaskInput projectId={projectId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
