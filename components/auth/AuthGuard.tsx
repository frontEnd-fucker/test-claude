'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const isAuthenticated = !!session

      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo)
      } else if (!requireAuth && isAuthenticated) {
        // If auth is not required but user is authenticated, redirect to home
        router.push('/')
      } else {
        setAuthenticated(isAuthenticated)
        setLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, redirectTo, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If auth is required and user is not authenticated, don't render children
  if (requireAuth && !authenticated) {
    return null
  }

  // If auth is not required and user is authenticated, don't render children
  if (!requireAuth && authenticated) {
    return null
  }

  return <>{children}</>
}