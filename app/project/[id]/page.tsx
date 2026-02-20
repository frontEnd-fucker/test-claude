import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { fetchTasks, fetchTimelineData } from "@/lib/queries/tasks/api";
import { taskKeys } from "@/lib/queries/tasks/query-keys";

import KanbanBoard from "@/components/kanban/Board";
import TodoList from "@/components/sidebar/TodoList";
import NotesEditor from "@/components/notes/NotesEditor";
import { AITaskInput } from "@/components/ai";
import ProjectTimeline from "@/components/timeline/ProjectTimeline";
import ProjectHeader from "@/components/project/ProjectHeader";

// Minimal skeleton for ProjectHeader fallback
function ProjectHeaderSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-sm">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-3 mx-2" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="mt-4 pt-4 border-t">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Minimal skeleton for ProjectTimeline fallback
function ProjectTimelineSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

// Minimal skeleton for KanbanBoard fallback
function KanbanBoardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal skeleton for TodoList fallback
function TodoListSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="h-6 w-24 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

// Minimal skeleton for NotesEditor fallback
function NotesEditorSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="h-6 w-16 bg-muted rounded animate-pulse mb-4" />
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  );
}

// Minimal skeleton for AITaskInput fallback
function AITaskInputSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="h-6 w-28 bg-muted rounded animate-pulse mb-4" />
      <div className="h-10 bg-muted rounded animate-pulse" />
    </div>
  );
}

// Server Component for project detail page
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  // Check authentication on server side
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Create a new QueryClient for server-side prefetching
  const serverQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 5,
      },
    },
  });

  // Prefetch tasks for hydration
  await serverQueryClient.prefetchQuery({
    queryKey: taskKeys.list({ projectId }),
    queryFn: () => fetchTasks(projectId, supabase),
  });

  // Prefetch timeline data for hydration
  await serverQueryClient.prefetchQuery({
    queryKey: taskKeys.timeline(projectId),
    queryFn: () => fetchTimelineData(projectId, supabase),
  });

  return (
    <div className="space-y-6">
      {/* Project Header - 使用 Suspense 流式渲染 */}
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <ProjectHeader projectId={projectId} />
      </Suspense>

      {/* Project Timeline - 使用 Suspense 流式渲染 */}
      <Suspense fallback={<ProjectTimelineSkeleton />}>
        <HydrationBoundary state={dehydrate(serverQueryClient)}>
          <ProjectTimeline projectId={projectId} />
        </HydrationBoundary>
      </Suspense>

      {/* Main dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Quick Tasks & Notes */}
        <div className="lg:col-span-1">
          <div className="sticky top-16 space-y-4">
            {/* Quick Tasks */}
            <Suspense fallback={<TodoListSkeleton />}>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-green" />
                  Quick Tasks
                </h2>
                <TodoList />
              </div>
            </Suspense>

            {/* Notes */}
            <Suspense fallback={<NotesEditorSkeleton />}>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-purple" />
                  Notes
                </h2>
                <NotesEditor />
              </div>
            </Suspense>
          </div>
        </div>

        {/* Main Kanban Board */}
        <div className="lg:col-span-2">
          <Suspense fallback={<KanbanBoardSkeleton />}>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-neon-cyan" />
                Project Board
                <span className="text-sm font-normal text-muted-foreground">
                  Drag and drop tasks between columns
                </span>
              </h2>
              <HydrationBoundary state={dehydrate(serverQueryClient)}>
                <KanbanBoard projectId={projectId} />
              </HydrationBoundary>
            </div>
          </Suspense>
        </div>

        {/* AI Task Split Area */}
        <div className="lg:col-span-1">
          <div className="sticky top-16">
            <Suspense fallback={<AITaskInputSkeleton />}>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon-green" />
                  AI Task Split
                </h2>
                <AITaskInput projectId={projectId} />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
