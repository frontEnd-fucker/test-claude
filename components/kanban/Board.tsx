"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import {
  useTasks,
  useReorderTasks,
  useMoveTaskBetweenColumns,
  useTaskSubscriptions,
} from "@/lib/queries/tasks";
import { TaskStatus, Task } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "complete", title: "Complete" },
];

export default function Board() {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Set up real-time subscriptions
  useTaskSubscriptions();

  // Fetch tasks using TanStack Query
  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  const reorderTasksMutation = useReorderTasks();
  const moveTaskBetweenColumnsMutation = useMoveTaskBetweenColumns();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    })
  );

  // Create a map of tasks for easy lookup
  const tasksMap = useMemo(() => {
    const map: Record<string, Task> = {};
    tasks.forEach((task) => {
      map[task.id] = task;
    });
    return map;
  }, [tasks]);

  // Get tasks for each column
  const columnTasks = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      complete: [],
    };
    tasks.forEach((task) => {
      result[task.status].push(task);
    });
    // Sort by position
    Object.keys(result).forEach((status) => {
      result[status as TaskStatus].sort((a, b) => a.position - b.position);
    });
    return result;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = tasksMap[activeId];
    if (!activeTask) return;

    // If dragging over a column
    if (["todo", "in-progress", "complete"].includes(overId)) {
      const overStatus = overId as TaskStatus;
      if (activeTask.status !== overStatus) {
        moveTaskBetweenColumnsMutation.mutate({
          sourceStatus: activeTask.status,
          destinationStatus: overStatus,
          sourceIndex: columnTasks[activeTask.status].findIndex((t) => t.id === activeId),
          destinationIndex: columnTasks[overStatus].length,
        });
      }
      return;
    }

    // If dragging over a task
    const overTask = tasksMap[overId];
    if (overTask) {
      if (activeTask.status !== overTask.status) {
        // Moving to a different column
        moveTaskBetweenColumnsMutation.mutate({
          sourceStatus: activeTask.status,
          destinationStatus: overTask.status,
          sourceIndex: columnTasks[activeTask.status].findIndex((t) => t.id === activeId),
          destinationIndex: columnTasks[overTask.status].findIndex((t) => t.id === overId),
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = tasksMap[activeId];
    if (!activeTask) return;

    // If dropped on a task in the same column, reorder
    if (!["todo", "in-progress", "complete"].includes(overId)) {
      const overTask = tasksMap[overId];
      if (overTask && activeTask.status === overTask.status) {
        const sameColumnTasks = columnTasks[activeTask.status];
        const oldIndex = sameColumnTasks.findIndex((t) => t.id === activeId);
        const newIndex = sameColumnTasks.findIndex((t) => t.id === overId);

        if (oldIndex !== newIndex) {
          reorderTasksMutation.mutate({
            status: activeTask.status,
            startIndex: oldIndex,
            endIndex: newIndex,
          });
        }
      }
    }
  };

  const activeTask = activeId ? tasksMap[activeId] : null;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="rounded-xl border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Error loading tasks</h3>
        </div>
        <p className="mt-2 text-sm">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TaskForm status="todo" />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              taskCount={columnTasks[column.id].length}
            >
              <SortableContext
                items={columnTasks[column.id].map((task) => task.id)}
              >
                {columnTasks[column.id].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-95">
              <TaskCard task={activeTask} isOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
