'use client'

import { useQuery } from '@tanstack/react-query'

interface AIUsageResponse {
  usedToday: number
  dailyLimit: number
  remaining: number
}

// Get default daily limit from environment variable
const DEFAULT_DAILY_LIMIT = parseInt(process.env.NEXT_PUBLIC_AI_DAILY_QUOTA_LIMIT || '50000', 10)

export function useAIUsage() {
  return useQuery<AIUsageResponse>({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const res = await fetch('/api/ai/usage')
      if (!res.ok) {
        // Return default values if unauthorized
        if (res.status === 401) {
          return { usedToday: 0, dailyLimit: DEFAULT_DAILY_LIMIT, remaining: DEFAULT_DAILY_LIMIT }
        }
        throw new Error('Failed to fetch AI usage')
      }
      return res.json()
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}
