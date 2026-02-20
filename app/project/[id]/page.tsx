import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { fetchTasks, fetchTimelineData } from "@/lib/queries/tasks/api";
import { taskKeys } from "@/lib/queries/tasks/query-keys";

import KanbanBoard, { KanbanBoardSkeleton } from "@/components/kanban/Board";
import TodoList, { TodoListSkeleton } from "@/components/sidebar/TodoList";
import NotesEditor, { NotesEditorSkeleton } from "@/components/notes/NotesEditor";
import { AITaskInput, AITaskInputSkeleton } from "@/components/ai";
import ProjectTimeline, { ProjectTimelineSkeleton } from "@/components/timeline/ProjectTimeline";
import ProjectHeader, { ProjectHeaderSkeleton } from "@/components/project/ProjectHeader";

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
  try {
    await serverQueryClient.prefetchQuery({
      queryKey: taskKeys.list({ projectId }),
      queryFn: () => fetchTasks(projectId, supabase),
    });
  } catch (error) {
    console.error('Failed to prefetch tasks:', error);
  }

  // Prefetch timeline data for hydration
  try {
    await serverQueryClient.prefetchQuery({
      queryKey: taskKeys.timeline(projectId),
      queryFn: () => fetchTimelineData(projectId, supabase),
    });
  } catch (error) {
    console.error('Failed to prefetch timeline:', error);
  }

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
