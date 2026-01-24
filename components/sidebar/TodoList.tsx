'use client'

import { useState } from 'react'
import { useTodos, useCreateTodo, useClearCompletedTodos, useTodoSubscriptions } from '@/lib/queries/todos'
import TodoItem from './TodoItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { ListSkeleton, MinimalSkeleton } from '@/components/ui/skeleton/index'

export default function TodoList() {
  const [newTodo, setNewTodo] = useState('')

  // Set up real-time subscriptions
  useTodoSubscriptions()

  // Fetch todos using TanStack Query
  const { data: todos = [], isLoading, error, refetch } = useTodos()

  // Mutation hooks
  const createTodoMutation = useCreateTodo()
  const clearCompletedMutation = useClearCompletedTodos()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    createTodoMutation.mutate({ text: newTodo })
    setNewTodo('')
  }

  const handleClearCompleted = () => {
    clearCompletedMutation.mutate()
  }

  if (isLoading && todos.length === 0) {
    return <MinimalSkeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Error loading tasks</h3>
        </div>
        <p className="mt-1 text-xs">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const incompleteTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a task..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks yet. Add one above!
          </p>
        ) : (
          <>
            {incompleteTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
            {completedTodos.length > 0 && (
              <>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Completed ({completedTodos.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCompleted}
                      className="h-7 text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                  {completedTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}