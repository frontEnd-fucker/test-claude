import { createClient } from '@/lib/supabase/server-client'
import { getUserQuota } from '@/lib/ai/quota'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quota = await getUserQuota(user.id)

    return Response.json({
      usedToday: quota.usedToday,
      dailyLimit: quota.dailyLimit,
      remaining: quota.remaining,
    })
  } catch (error) {
    console.error('AI usage API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
