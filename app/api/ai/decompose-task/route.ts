import { NextRequest, NextResponse } from 'next/server'
import { decomposeTask } from '@/lib/ai/deepseek'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userInput } = body

    console.log('[AI API] Received request:', { userInput: userInput?.substring(0, 100) })

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      )
    }

    const tasks = await decomposeTask(userInput)
    console.log('[AI API] Successfully decomposed task, count:', tasks.length)

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('AI decompose task error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
