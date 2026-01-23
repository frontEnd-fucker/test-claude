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
      // 当认证状态变化时刷新页面以同步服务器状态
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return <>{children}</>
}