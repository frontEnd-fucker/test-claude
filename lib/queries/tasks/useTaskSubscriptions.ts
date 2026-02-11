import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { taskKeys } from './query-keys'
import { Task } from '@/types/database'
import { isTempId } from '@/types'

/**
 * Hook to set up real-time subscriptions for tasks
 */
export function useTaskSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('tasks', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Task format
      const convertToTask = (record: Record<string, unknown>): Task => ({
        id: record.id as string,
        title: record.title as string,
        description: record.description as string,
        status: record.status as Task['status'],
        priority: record.priority as Task['priority'],
        position: record.position as number,
        userId: record.user_id as string,
        projectId: record.project_id as string,
        assigneeId: record.assignee_id ? (record.assignee_id as string) : undefined,
        dueDate: record.due_date ? new Date(record.due_date as string) : undefined,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newTask = convertToTask(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Task | Task[]>({
            queryKey: taskKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 检查是否已存在相同ID的任务
              const existingIndex = data.findIndex(task => task.id === newTask.id)
              let updatedTasks: Task[]

              if (existingIndex !== -1) {
                // 更新现有任务（可能替换临时任务或更新数据）
                updatedTasks = [...data]
                updatedTasks[existingIndex] = newTask
              } else {
                // 添加新任务到开头
                updatedTasks = [newTask, ...data]
              }

              // 移除任何具有相同标题、相同项目ID且ID以'temp-'开头的临时任务
              // 因为真实任务现在已经存在
              updatedTasks = updatedTasks.filter(task => {
                if (isTempId(task.id) && task.title === newTask.title && task.projectId === newTask.projectId) {
                  // 检查描述是否匹配（如果两者都有描述或都为null/undefined）
                  const taskDesc = task.description || ''
                  const newTaskDesc = newTask.description || ''
                  if (taskDesc === newTaskDesc) {
                    return false // 移除临时任务
                  }
                }
                return true
              })

              queryClient.setQueryData(queryKey, updatedTasks)
            }
            // 详情查询不需要处理INSERT事件
          })

          break
        }

        case 'UPDATE': {
          console.log('useTaskSubscriptions - UPDATE event:', {
            eventType,
            oldRecord: oldRecord,
            newRecord: newRecord,
            assignee_id: newRecord.assignee_id,
            taskId: newRecord.id,
            updated_at: newRecord.updated_at
          })
          const updatedTask = convertToTask(newRecord)
          console.log('useTaskSubscriptions - converted task:', updatedTask)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Task | Task[]>({
            queryKey: taskKeys.all,
          })
          console.log('useTaskSubscriptions - found queries:', allQueries.length)

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 更新数组中的任务
              const updatedTasks = data.map(task =>
                task.id === updatedTask.id ? updatedTask : task
              )
              console.log('useTaskSubscriptions - updating array query:', queryKey)
              queryClient.setQueryData(queryKey, updatedTasks)
            }
            // 详情查询不通过实时订阅更新，由 useTaskDetail 和 onSuccess 回调管理
            // 这样可以避免实时订阅干扰用户当前正在编辑的任务详情页
          })

          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Task | Task[]>({
            queryKey: taskKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 从数组中移除任务
              const updatedTasks = data.filter(task => task.id !== deletedId)
              queryClient.setQueryData(queryKey, updatedTasks)
            } else if (data && typeof data === 'object' && (data as Task).id === deletedId) {
              // 详情查询 - 设置为undefined
              queryClient.setQueryData(queryKey, undefined)
            }
          })

          break
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])
}