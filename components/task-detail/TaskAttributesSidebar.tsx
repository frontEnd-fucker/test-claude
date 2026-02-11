'use client'

import React, { useState } from 'react'
import { Task } from '@/types'
import { useUpdateTask } from '@/lib/queries/tasks'
import { useProjectMembers } from '@/lib/queries/members/useProjectMembers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, User, Flag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TaskAttributesSidebarProps {
  task: Task
  projectId: string
}

export default function TaskAttributesSidebar({ task, projectId }: TaskAttributesSidebarProps) {
  const updateTaskMutation = useUpdateTask()
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''
  )

  // Local state for immediate UI feedback
  const [localAssigneeId, setLocalAssigneeId] = useState<string>(
    task.assigneeId || 'unassigned'
  )

  // Sync local state when task.assigneeId changes
  React.useEffect(() => {
    setLocalAssigneeId(task.assigneeId || 'unassigned')
  }, [task.assigneeId])

  // Reset local state on mutation error
  React.useEffect(() => {
    if (updateTaskMutation.isError) {
      console.log('Mutation error, resetting localAssigneeId to task.assigneeId:', task.assigneeId || 'unassigned')
      setLocalAssigneeId(task.assigneeId || 'unassigned')
    }
  }, [updateTaskMutation.isError, task.assigneeId])

  // Stable value for Select component
  const selectValue = localAssigneeId

  // Debug: log task assigneeId changes
  React.useEffect(() => {
    console.log('TaskAttributesSidebar - task.assigneeId changed:', {
      taskId: task.id,
      assigneeId: task.assigneeId,
      selectValue,
      isUndefined: task.assigneeId === undefined,
      isNull: task.assigneeId === null,
      typeof: typeof task.assigneeId
    })
  }, [task.assigneeId, task.id, selectValue])

  const { data: members = [], isLoading: isLoadingMembers, error: membersError } = useProjectMembers(projectId)

  // Debug logging for members query
  React.useEffect(() => {
    if (membersError) {
      console.error('Error fetching project members:', membersError)
    }
    if (members.length > 0) {
      console.log('Project members loaded:', {
        count: members.length,
        members: members.map(m => ({ id: m.userId, name: m.user?.name, email: m.user?.email }))
      })
    }
  }, [members, membersError])

  const handlePriorityChange = (value: string) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { priority: value === 'none' ? undefined : value as Task['priority'] },
    })
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDueDate(newDate)

    if (newDate) {
      updateTaskMutation.mutate({
        id: task.id,
        updates: { dueDate: new Date(newDate) },
      })
    } else {
      updateTaskMutation.mutate({
        id: task.id,
        updates: { dueDate: undefined },
      })
    }
  }

  const handleAssigneeChange = (value: string) => {
    console.log('Assignee change triggered:', { value, taskId: task.id })
    // Update local state immediately for responsive UI
    setLocalAssigneeId(value)

    const assigneeId = value === 'unassigned' ? undefined : value
    console.log('Assignee ID to update:', assigneeId)

    updateTaskMutation.mutate({
      id: task.id,
      updates: { assigneeId },
    })
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-muted-foreground'
    }
  }

  const getPriorityBg = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10'
      case 'medium': return 'bg-yellow-500/10'
      case 'low': return 'bg-green-500/10'
      default: return 'bg-muted'
    }
  }

  console.log('TaskAttributesSidebar rendering:', {
    taskId: task.id,
    assigneeId: task.assigneeId,
    localAssigneeId,
    selectValue,
    membersCount: members.length
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Properties</span>
          {updateTaskMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignee */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Assignee
          </Label>
          <Select
            key={`assignee-select-${task.id}-${selectValue}`}
            value={selectValue}
            onValueChange={handleAssigneeChange}
            disabled={updateTaskMutation.isPending || isLoadingMembers}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned">
                {localAssigneeId !== 'unassigned' ? (() => {
                  const member = members.find((m) => m.userId === localAssigneeId)
                  return (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        {member?.user?.avatarUrl ? (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={member.user.name || member.user.email}
                          />
                        ) : null}
                        <AvatarFallback className="text-[8px]">
                          {member?.user?.name?.[0]?.toUpperCase() ||
                            member?.user?.email?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member?.user?.name || member?.user?.email || 'Unknown User'}
                      </span>
                    </div>
                  )
                })() : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground flex items-center justify-center">
                    <span className="text-[8px] text-muted-foreground">?</span>
                  </div>
                  <span className="text-muted-foreground">Unassigned</span>
                </div>
              </SelectItem>
              {isLoadingMembers ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <span className="mt-2 block">Loading members...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No project members found
                </div>
              ) : (
                members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        {member.user?.avatarUrl ? (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={member.user.name || member.user.email}
                          />
                        ) : null}
                        <AvatarFallback className="text-[8px]">
                          {member.user?.name?.[0]?.toUpperCase() ||
                            member.user?.email?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{member.user?.name || member.user?.email || 'Unknown User'}</span>
                        {member.user?.email && member.user.name && (
                          <span className="text-xs text-muted-foreground">
                            {member.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </Label>
          <Input
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
            disabled={updateTaskMutation.isPending}
            className="w-full"
          />
          {task.dueDate && (
            <p className="text-sm text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Priority
          </Label>
          <Select
            value={task.priority || 'none'}
            onValueChange={handlePriorityChange}
            disabled={updateTaskMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue>
                {task.priority ? (
                  <span className={cn(
                    'inline-flex items-center gap-2',
                    getPriorityColor(task.priority)
                  )}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                ) : (
                  'Not set'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="flex items-center gap-2 text-muted-foreground">
                  Not set
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2 text-green-500">
                  <span className="h-2 w-2 rounded-full bg-current" />
                  Low
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2 text-yellow-500">
                  <span className="h-2 w-2 rounded-full bg-current" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2 text-red-500">
                  <span className="h-2 w-2 rounded-full bg-current" />
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {task.priority && (
            <div className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm',
              getPriorityBg(task.priority),
              getPriorityColor(task.priority)
            )}>
              <Flag className="h-3 w-3" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
            </div>
          )}
        </div>

        {/* Additional info */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last updated</span>
            <span className="font-medium">
              {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Task ID</span>
            <span className="font-mono text-xs">{task.id.slice(0, 8)}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}