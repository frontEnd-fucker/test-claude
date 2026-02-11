import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { projectKeys } from './query-keys'
import { Project } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for projects
 */
export function useProjectSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('projects', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Project format
      const convertToProject = (record: Record<string, unknown>): Project => ({
        id: record.id as string,
        name: record.name as string,
        description: record.description as string,
        userId: record.user_id as string,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newProject = convertToProject(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Project | Project[]>({
            queryKey: projectKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 检查是否已存在相同ID的项目
              const existingIndex = data.findIndex(project => project.id === newProject.id)
              let updatedProjects: Project[]

              if (existingIndex !== -1) {
                // 更新现有项目（可能替换临时项目或更新数据）
                updatedProjects = [...data]
                updatedProjects[existingIndex] = newProject
              } else {
                // 添加新项目到开头
                updatedProjects = [newProject, ...data]
              }

              // 移除任何具有相同名称且ID以'temp-'开头的临时项目
              // 因为真实项目现在已经存在
              updatedProjects = updatedProjects.filter(project => {
                if (project.id.startsWith('temp-') && project.name === newProject.name) {
                  // 检查描述是否匹配（如果两者都有描述或都为null/undefined）
                  const projectDesc = project.description || ''
                  const newProjectDesc = newProject.description || ''
                  if (projectDesc === newProjectDesc) {
                    return false // 移除临时项目
                  }
                }
                return true
              })

              queryClient.setQueryData(queryKey, updatedProjects)
            }
            // 详情查询不需要处理INSERT事件
          })

          break
        }

        case 'UPDATE': {
          const updatedProject = convertToProject(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Project | Project[]>({
            queryKey: projectKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 更新数组中的项目
              const updatedProjects = data.map(project =>
                project.id === updatedProject.id ? updatedProject : project
              )
              queryClient.setQueryData(queryKey, updatedProjects)
            } else if (data && typeof data === 'object' && (data as Project).id === updatedProject.id) {
              // 详情查询 - 更新单个项目
              queryClient.setQueryData(queryKey, updatedProject)
            }
            // 其他情况不处理
          })

          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Project | Project[]>({
            queryKey: projectKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 从数组中移除项目
              const updatedProjects = data.filter(project => project.id !== deletedId)
              queryClient.setQueryData(queryKey, updatedProjects)
            } else if (data && typeof data === 'object' && (data as Project).id === deletedId) {
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