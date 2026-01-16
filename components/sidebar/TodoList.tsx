'use client'

import { useState } from 'react'
import { useTodoStore } from '@/lib/store'
import TodoItem from './TodoItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

export default function TodoList() {
  const { todos, addTodo, clearCompleted } = useTodoStore()
  const [newTodo, setNewTodo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    addTodo(newTodo)
    setNewTodo('')
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
                      onClick={clearCompleted}
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