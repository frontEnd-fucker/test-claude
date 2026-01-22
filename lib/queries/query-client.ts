import { QueryClient } from '@tanstack/react-query'

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time: 5 minutes
      gcTime: 1000 * 60 * 5,
      // Stale time: 1 minute
      staleTime: 1000 * 60 * 1,
      // Retry failed queries 3 times (except authentication errors)
      retry: (failureCount, error) => {
        // Don't retry on authentication errors (401, 403)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status
          if (status === 401 || status === 403) {
            return false
          }
        }
        return failureCount < 3
      },
      // Refetch on window focus
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
})