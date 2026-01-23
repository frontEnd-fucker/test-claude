'use client'

import { TodoItem as TodoItemType } from '@/types'
import { useToggleTodo, useDeleteTodo } from '@/lib/queries/todos'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodoItemProps {
  todo: TodoItemType
}

export default function TodoItem({ todo }: TodoItemProps) {
  const toggleTodoMutation = useToggleTodo()
  const deleteTodoMutation = useDeleteTodo()

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/50 cursor-pointer',
        todo.completed && 'opacity-60'
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => toggleTodoMutation.mutate(todo.id)}
        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            todo.completed && 'line-through text-muted-foreground'
          )}
        >
          {todo.text}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(todo.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => deleteTodoMutation.mutate(todo.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}