'use client'

import { useQuery } from '@tanstack/react-query'

interface AIUsageResponse {
  usedToday: number
  dailyLimit: number
  remaining: number
}

export function useAIUsage() {
  return useQuery<AIUsageResponse>({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const res = await fetch('/api/ai/usage')
      if (!res.ok) {
        // 如果未登录或无权限，返回默认值
        if (res.status === 401) {
          return { usedToday: 0, dailyLimit: 50000, remaining: 50000 }
        }
        throw new Error('Failed to fetch AI usage')
      }
      return res.json()
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}
