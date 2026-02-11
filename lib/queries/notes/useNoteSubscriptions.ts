import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { noteKeys } from './query-keys'
import { Note } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for notes
 */
export function useNoteSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('notes', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Note format
      const convertToNote = (record: Record<string, unknown>): Note => ({
        id: record.id as string,
        title: record.title as string,
        content: record.content as string,
        tags: record.tags as string[],
        isArchived: record.is_archived as boolean,
        userId: record.user_id as string,
        projectId: record.project_id as string,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newNote = convertToNote(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Note | Note[]>({
            queryKey: noteKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 检查查询是否过滤了projectId
              const queryFilters = extractFiltersFromQueryKey(queryKey)
              const shouldInclude = shouldIncludeNoteInQuery(newNote, queryFilters)

              if (shouldInclude) {
                // 列表查询 - 添加新笔记到开头
                queryClient.setQueryData(queryKey, [newNote, ...data])
              }
            }
            // 详情查询不需要处理INSERT事件
          })

          break
        }

        case 'UPDATE': {
          const updatedNote = convertToNote(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Note | Note[]>({
            queryKey: noteKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 检查查询是否过滤了projectId
              const queryFilters = extractFiltersFromQueryKey(queryKey)
              const shouldInclude = shouldIncludeNoteInQuery(updatedNote, queryFilters)

              // 查找数组中是否已有该笔记
              const existingNoteIndex = data.findIndex(note => note.id === updatedNote.id)
              const hasExistingNote = existingNoteIndex !== -1

              if (shouldInclude) {
                if (hasExistingNote) {
                  // 更新现有笔记
                  const updatedNotes = data.map(note =>
                    note.id === updatedNote.id ? updatedNote : note
                  )
                  queryClient.setQueryData(queryKey, updatedNotes)
                } else {
                  // 笔记之前不在列表中，现在应该添加（例如projectId改变）
                  queryClient.setQueryData(queryKey, [updatedNote, ...data])
                }
              } else if (hasExistingNote) {
                // 笔记不再符合过滤条件，从列表中移除
                const updatedNotes = data.filter(note => note.id !== updatedNote.id)
                queryClient.setQueryData(queryKey, updatedNotes)
              }
            } else if (data && typeof data === 'object' && (data as Note).id === updatedNote.id) {
              // 详情查询 - 更新单个笔记
              queryClient.setQueryData(queryKey, updatedNote)
            }
            // 其他情况不处理
          })

          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<Note | Note[]>({
            queryKey: noteKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 从数组中移除笔记（不需要检查过滤条件，因为笔记已被删除）
              const updatedNotes = data.filter(note => note.id !== deletedId)
              queryClient.setQueryData(queryKey, updatedNotes)
            } else if (data && typeof data === 'object' && (data as Note).id === deletedId) {
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

// Helper function to extract filters from query key
function extractFiltersFromQueryKey(queryKey: unknown): { projectId?: string; isArchived?: boolean } {
  if (!Array.isArray(queryKey)) return {}

  // Query key format: ['notes', 'list', { filters: { projectId?, isArchived? } }]
  const filtersIndex = queryKey.findIndex(item =>
    typeof item === 'object' && item !== null && 'filters' in item
  )

  if (filtersIndex !== -1) {
    const filtersObj = queryKey[filtersIndex] as { filters?: { projectId?: string; isArchived?: boolean } }
    return filtersObj.filters || {}
  }

  return {}
}

// Helper function to check if a note should be included in a query based on filters
function shouldIncludeNoteInQuery(note: Note, filters: { projectId?: string; isArchived?: boolean }): boolean {
  // Check projectId filter
  if (filters.projectId !== undefined && note.projectId !== filters.projectId) {
    return false
  }

  // Check isArchived filter
  if (filters.isArchived !== undefined && note.isArchived !== filters.isArchived) {
    return false
  }

  return true
}