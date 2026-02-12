import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { decomposeTask, MAX_INPUT_LENGTH } from '@/lib/ai/deepseek'
import { checkAndUseQuota, recordUsage } from '@/lib/ai/quota'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userInput } = body

    console.log('[AI API] Received request:', { userInput: userInput?.substring(0, 100) })

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      )
    }

    // 输入长度验证
    if (userInput.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `输入长度超过限制，最大 ${MAX_INPUT_LENGTH} 字符` },
        { status: 400 }
      )
    }

    // 预估需要的 tokens（简单估算：1 token ≈ 4 字符）
    const estimatedTokens = Math.ceil(userInput.length / 4) + 1000

    // 配额检查
    try {
      await checkAndUseQuota(user.id, estimatedTokens)
    } catch (err) {
      const quotaError = err as { statusCode?: number; message: string }
      return NextResponse.json(
        { error: quotaError.message, remaining: 0 },
        { status: 429 }
      )
    }

    const result = await decomposeTask(userInput)

    // 记录实际使用量
    if (result.tokensUsed > 0) {
      await recordUsage(user.id, result.tokensUsed)
    }

    console.log('[AI API] Successfully decomposed task, count:', result.tasks.length)

    return NextResponse.json({ tasks: result.tasks })
  } catch (error) {
    console.error('AI decompose task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
