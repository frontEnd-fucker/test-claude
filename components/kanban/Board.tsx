"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
  pointerWithin,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useState } from "react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import {
  useTasks,
  useReorderTasks,
  useMoveTaskBetweenColumns,
  useTaskSubscriptions,
} from "@/lib/queries/tasks";
import { TaskStatus } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "complete", title: "Complete" },
];

export default function Board() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  // Set up real-time subscriptions
  useTaskSubscriptions();

  // Fetch tasks using TanStack Query
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useTasks();
  const reorderTasksMutation = useReorderTasks();
  const moveTaskBetweenColumnsMutation = useMoveTaskBetweenColumns();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Increased to reduce accidental activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reduced delay for better touch response
        tolerance: 8, // Increased tolerance for easier touch dragging
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setOverColumn(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }

    // Check if over is a column
    if (over.data?.current?.type === "column") {
      setOverColumn(over.id as string);
      return;
    }

    // Check if over is a task - get its column status
    if (over.data?.current?.type === "task") {
      setOverColumn(over.data.current.status as string);
      return;
    }

    // Check if over.id is a column ID (when dropping on empty column or placeholder)
    if (["todo", "in-progress", "complete"].includes(over.id as string)) {
      setOverColumn(over.id as string);
      return;
    }

    setOverColumn(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    // If dropped on a column (including placeholder for empty columns)
    if (
      ["todo", "in-progress", "complete"].includes(overId) ||
      overId.includes("-placeholder")
    ) {
      const newStatus = overId.includes("-placeholder")
        ? (overId.replace("-placeholder", "") as TaskStatus)
        : (overId as TaskStatus);
      if (activeTask.status !== newStatus) {
        // Move between columns
        const sourceTasks = tasks.filter(
          (task) => task.status === activeTask.status
        );
        const sourceIndex = sourceTasks.findIndex(
          (task) => task.id === activeId
        );
        const destTasks = tasks.filter((task) => task.status === newStatus);
        const destIndex = destTasks.length;

        moveTaskBetweenColumnsMutation.mutate({
          sourceStatus: activeTask.status,
          destinationStatus: newStatus,
          sourceIndex,
          destinationIndex: destIndex,
        });
      }
      return;
    }

    // Find the over task
    const overTask = tasks.find((task) => task.id === overId);
    if (!overTask) return;

    // If dropped on a task in the same column
    if (activeTask.status === overTask.status) {
      const columnTasks = tasks.filter(
        (task) => task.status === activeTask.status
      );
      const oldIndex = columnTasks.findIndex((task) => task.id === activeId);
      const newIndex = columnTasks.findIndex((task) => task.id === overId);

      if (oldIndex !== newIndex) {
        reorderTasksMutation.mutate({
          status: activeTask.status,
          startIndex: oldIndex,
          endIndex: newIndex,
        });
      }
    } else {
      // Move to another column
      const sourceTasks = tasks.filter(
        (task) => task.status === activeTask.status
      );
      const destTasks = tasks.filter((task) => task.status === overTask.status);
      const sourceIndex = sourceTasks.findIndex((task) => task.id === activeId);
      const destIndex = destTasks.findIndex((task) => task.id === overId);

      moveTaskBetweenColumnsMutation.mutate({
        sourceStatus: activeTask.status,
        destinationStatus: overTask.status,
        sourceIndex,
        destinationIndex: destIndex,
      });
    }
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading tasks...</p>
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
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.id
            );
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                taskCount={columnTasks.length}
                isOver={overColumn === column.id}
              >
                <SortableContext
                  items={
                    columnTasks.length === 0
                      ? [`${column.id}-placeholder`]
                      : columnTasks.map((task) => task.id)
                  }
                >
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
              </Column>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} isOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
