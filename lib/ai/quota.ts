import { createClient } from '@/lib/supabase/server-client'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/supabase/config'

export interface UserQuota {
  dailyLimit: number
  usedToday: number
  remaining: number
}

export interface UsageRecord {
  usedTokens: number
  usedDate: string
}

// 默认每日配额（tokens）
const DEFAULT_DAILY_LIMIT = 50000

/**
 * 创建 admin client（使用 service role，绕过 RLS）
 */
async function createAdminSupabase() {
  const config = getSupabaseConfig()
  return createAdminClient(config.url, config.serviceRoleKey!)
}

/**
 * 获取用户的 AI 使用配额信息（使用 admin client）
 */
export async function getUserQuota(userId: string): Promise<UserQuota> {
  const supabase = await createAdminSupabase()

  // 获取用户配额设置
  const { data: quota } = await supabase
    .from('ai_quota')
    .select('daily_limit')
    .eq('user_id', userId)
    .single()

  const dailyLimit = quota?.daily_limit ?? DEFAULT_DAILY_LIMIT

  // 获取今日使用量
  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('used_tokens')
    .eq('user_id', userId)
    .eq('used_date', today)
    .single()

  const usedToday = usage?.used_tokens ?? 0

  return {
    dailyLimit,
    usedToday,
    remaining: Math.max(0, dailyLimit - usedToday),
  }
}

/**
 * 检查并使用配额
 * @param userId 用户 ID
 * @param tokensNeeded 需要的 tokens 数量
 * @returns 配额检查结果，如果失败则抛出错误
 */
export async function checkAndUseQuota(
  userId: string,
  tokensNeeded: number
): Promise<void> {
  const quota = await getUserQuota(userId)

  if (quota.remaining < tokensNeeded) {
    const error = new Error(
      `AI 配额不足：今日已使用 ${quota.usedToday}/${quota.dailyLimit} tokens，剩余 ${quota.remaining} tokens`
    )
    ;(error as { statusCode?: number }).statusCode = 429
    throw error
  }
}

/**
 * 记录 AI 使用量（使用 admin client 绕过 RLS）
 * @param userId 用户 ID
 * @param tokensUsed 使用的 tokens 数量
 */
export async function recordUsage(userId: string, tokensUsed: number): Promise<void> {
  const supabase = await createAdminSupabase()
  const today = new Date().toISOString().split('T')[0]

  // 先查询今日是否有记录
  const { data: existing } = await supabase
    .from('ai_usage')
    .select('id, used_tokens')
    .eq('user_id', userId)
    .eq('used_date', today)
    .single()

  if (existing) {
    // 更新现有记录（累加）
    await supabase
      .from('ai_usage')
      .update({
        used_tokens: existing.used_tokens + tokensUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    // 创建新记录
    await supabase.from('ai_usage').insert({
      user_id: userId,
      used_tokens: tokensUsed,
      used_date: today,
    })
  }
}

/**
 * 检查错误是否为配额超限错误
 */
export function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('配额不足')
  }
  return false
}

/**
 * 创建或初始化用户配额记录（使用 admin client 绕过 RLS）
 * @param userId 用户 ID
 * @param dailyLimit 每日限额（可选）
 */
export async function initializeUserQuota(
  userId: string,
  dailyLimit: number = DEFAULT_DAILY_LIMIT
): Promise<void> {
  const supabase = await createAdminSupabase()

  await supabase.from('ai_quota').upsert(
    {
      user_id: userId,
      daily_limit: dailyLimit,
    },
    { onConflict: 'user_id' }
  )
}

/**
 * 获取今日使用量记录（使用 admin client）
 */
export async function getTodayUsage(userId: string): Promise<UsageRecord | null> {
  const supabase = await createAdminSupabase()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ai_usage')
    .select('used_tokens, used_date')
    .eq('user_id', userId)
    .eq('used_date', today)
    .single()

  return data
    ? { usedTokens: data.used_tokens, usedDate: data.used_date }
    : null
}
