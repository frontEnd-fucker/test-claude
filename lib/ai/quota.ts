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

// Default daily limit (tokens) - can be overridden per user
const DEFAULT_DAILY_LIMIT = 50000

// Get daily limit from environment or use default
export function getDefaultDailyLimit(): number {
  if (typeof process !== 'undefined' && process.env.AI_DAILY_QUOTA_LIMIT) {
    return parseInt(process.env.AI_DAILY_QUOTA_LIMIT, 10)
  }
  return DEFAULT_DAILY_LIMIT
}

// Get quota warning threshold from environment
export function getQuotaWarningThreshold(): number {
  if (typeof process !== 'undefined' && process.env.AI_QUOTA_WARNING_THRESHOLD) {
    return parseInt(process.env.AI_QUOTA_WARNING_THRESHOLD, 10)
  }
  return 5000
}

/**
 * Create admin client (using service role to bypass RLS)
 */
async function createAdminSupabase() {
  const config = getSupabaseConfig()
  return createAdminClient(config.url, config.serviceRoleKey!)
}

/**
 * Get user's AI quota info (using admin client)
 * Uses UTC date to avoid timezone issues
 */
export async function getUserQuota(userId: string): Promise<UserQuota> {
  const supabase = await createAdminSupabase()

  // Get user's quota setting
  const { data: quota } = await supabase
    .from('ai_quota')
    .select('daily_limit')
    .eq('user_id', userId)
    .maybeSingle()

  const dailyLimit = quota?.daily_limit ?? getDefaultDailyLimit()

  // Get today's usage using UTC date
  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('used_tokens')
    .eq('user_id', userId)
    .eq('used_date', today)
    .maybeSingle()

  const usedToday = usage?.used_tokens ?? 0

  return {
    dailyLimit,
    usedToday,
    remaining: Math.max(0, dailyLimit - usedToday),
  }
}

/**
 * Check and use quota
 * @param userId User ID
 * @param tokensNeeded Tokens needed
 * @throws Error if quota is insufficient
 */
export async function checkAndUseQuota(
  userId: string,
  tokensNeeded: number
): Promise<void> {
  const quota = await getUserQuota(userId)

  if (quota.remaining < tokensNeeded) {
    const error = new Error(
      `AI quota insufficient: used ${quota.usedToday}/${quota.dailyLimit} tokens today, ${quota.remaining} remaining`
    )
    ;(error as { statusCode?: number }).statusCode = 429
    throw error
  }
}

/**
 * Record AI usage (atomic operation to prevent race conditions)
 * Uses raw SQL upsert to ensure atomic increment
 * @param userId User ID
 * @param tokensUsed Tokens used
 */
export async function recordUsage(userId: string, tokensUsed: number): Promise<void> {
  const supabase = await createAdminSupabase()
  const today = new Date().toISOString().split('T')[0]

  // Use raw SQL for atomic upsert to prevent race conditions
  const { error } = await supabase.rpc('increment_ai_usage', {
    p_user_id: userId,
    p_tokens: tokensUsed,
    p_date: today,
  })

  if (error) {
    console.error('Failed to record AI usage:', error)
    throw error
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
