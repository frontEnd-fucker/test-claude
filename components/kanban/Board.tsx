'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useState } from 'react'
import Column from './Column'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import { useKanbanStore } from '@/lib/store'
import { TaskStatus } from '@/types'

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Complete' },
]

export default function Board() {
  const { tasks, reorderTasks, moveTaskBetweenColumns } = useKanbanStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the task being dragged
    const activeTask = tasks.find((task) => task.id === activeId)
    if (!activeTask) return

    // If dropped on a column
    if (['todo', 'in-progress', 'complete'].includes(overId)) {
      const newStatus = overId as TaskStatus
      if (activeTask.status !== newStatus) {
        // Move between columns
        const sourceTasks = tasks.filter((task) => task.status === activeTask.status)
        const sourceIndex = sourceTasks.findIndex((task) => task.id === activeId)
        const destTasks = tasks.filter((task) => task.status === newStatus)
        const destIndex = destTasks.length

        moveTaskBetweenColumns(activeTask.status, newStatus, sourceIndex, destIndex)
      }
      return
    }

    // Find the over task
    const overTask = tasks.find((task) => task.id === overId)
    if (!overTask) return

    // If dropped on a task in the same column
    if (activeTask.status === overTask.status) {
      const columnTasks = tasks.filter((task) => task.status === activeTask.status)
      const oldIndex = columnTasks.findIndex((task) => task.id === activeId)
      const newIndex = columnTasks.findIndex((task) => task.id === overId)

      if (oldIndex !== newIndex) {
        reorderTasks(activeTask.status, oldIndex, newIndex)
      }
    } else {
      // Move to another column
      const sourceTasks = tasks.filter((task) => task.status === activeTask.status)
      const destTasks = tasks.filter((task) => task.status === overTask.status)
      const sourceIndex = sourceTasks.findIndex((task) => task.id === activeId)
      const destIndex = destTasks.findIndex((task) => task.id === overId)

      moveTaskBetweenColumns(activeTask.status, overTask.status, sourceIndex, destIndex)
    }
  }

  const activeTask = tasks.find((task) => task.id === activeId)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TaskForm />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id)
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                taskCount={columnTasks.length}
              >
                <SortableContext items={columnTasks.map((task) => task.id)}>
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
              </Column>
            )
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
  )
}