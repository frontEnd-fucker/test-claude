import { PriorityLevel } from '@/types'

export interface TaskSuggestion {
  title: string
  description?: string
  priority: PriorityLevel
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const SYSTEM_PROMPT = `你是一个项目管理专家。用户会描述一个需求或目标，你需要将其拆分成具体的、可执行的任务。

要求：
1. 每个任务应该是独立的、可执行的原子工作项
2. 任务数量控制在 3-8 个之间
3. 根据任务复杂度和依赖关系为每个任务设置优先级
4. 只返回 JSON 数组，不要有其他文字

请返回以下格式的 JSON：
[
  {
    "title": "任务标题（简洁明了）",
    "description": "任务详细描述（可选）",
    "priority": "high/medium/low"
  }
]

注意：priority 只能是 high、medium 或 low 三个值之一。`

export async function decomposeTask(userInput: string): Promise<TaskSuggestion[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('Missing DEEPSEEK_API_KEY environment variable')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ] as DeepSeekMessage[],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${error}`)
  }

  const data: DeepSeekResponse = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No choices in DeepSeek response')
  }

  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in DeepSeek response')
  }

  // 尝试解析 JSON
  try {
    // 清理可能的 markdown 代码块标记
    const cleanedContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const tasks = JSON.parse(cleanedContent) as TaskSuggestion[]

    // 验证任务格式
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array')
    }

    return tasks.map(task => ({
      title: task.title || '未命名任务',
      description: task.description || '',
      priority: ['high', 'medium', 'low'].includes(task.priority || '')
        ? task.priority as PriorityLevel
        : 'medium',
    }))
  } catch (parseError) {
    console.error('Failed to parse DeepSeek response:', content)
    throw new Error('Failed to parse AI response')
  }
}
