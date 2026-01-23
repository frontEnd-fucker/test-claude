'use client'

import { useState, useEffect } from 'react'
import { useCreateTask, useUpdateTask } from '@/lib/queries/tasks'
import { useProjects } from '@/lib/queries/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Task, TaskStatus } from '@/types'

interface TaskFormProps {
  task?: Task
  status?: TaskStatus
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  onSubmit?: (taskData: { title: string; description?: string; priority?: 'low' | 'medium' | 'high'; status: TaskStatus; projectId?: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export default function TaskForm({
  task,
  status = 'todo',
  buttonText = 'Add Task',
  buttonVariant = 'default',
  buttonSize = 'default',
  showIcon = true,
  onSubmit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger = false,
}: TaskFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium')
  const [projectId, setProjectId] = useState<string | undefined>(task?.projectId || undefined)
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const { data: projects = [] } = useProjects()

  // Sync form data when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority || 'medium')
      setProjectId(task.projectId || undefined)
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (onSubmit) {
      onSubmit({ title, description, priority, status: task?.status || status, projectId })
    } else if (task) {
      // Edit mode
      updateTaskMutation.mutate({
        id: task.id,
        updates: { title, description, priority, status: task.status, projectId },
      })
    } else {
      // Create mode
      createTaskMutation.mutate({
        title,
        description,
        priority,
        status,
        projectId,
      })
    }

    if (!task) {
      // Only reset form for new tasks
      setTitle('')
      setDescription('')
      setPriority('medium')
      setProjectId(undefined)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize}>
            {showIcon && <Plus className={`h-4 w-4 ${buttonText ? 'mr-2' : ''}`} />}
            {buttonText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
            ({task ? (task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)) : (status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1))})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Project (optional)</label>
            <Select value={projectId || 'none'} onValueChange={(value) => setProjectId(value === 'none' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? 'Update Task' : 'Create Task'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}