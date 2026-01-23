'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== localStorage.getItem('supabase.auth.token')) {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return <>{children}</>
}