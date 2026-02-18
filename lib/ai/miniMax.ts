import { PriorityLevel } from '@/types'

export interface TaskSuggestion {
  title: string
  description?: string
  priority: PriorityLevel
  dueDate?: string // ISO 8601 日期格式 YYYY-MM-DD
}

interface MiniMaxMessage {
  role: 'system' | 'user'
  content: string
}

interface MiniMaxResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const SYSTEM_PROMPT = `你是一个项目管理专家。用户会描述一个需求或目标，你需要将其拆分成具体的、可执行的任务。

要求：
1. 每个任务应该是独立的、可执行的原子工作项
2. 任务数量控制在 3-8 个之间
3. 根据任务复杂度和依赖关系为每个任务设置优先级
4. 尝试从用户输入中提取截止日期（dueDate），支持以下格式：
   - 具体日期：2024-12-31、12月31日、12.31
   - 相对日期：3天后、下周、本月底
   - 如果无法确定具体日期，不要设置 dueDate
5. 只返回 JSON 数组，不要有其他文字

请返回以下格式的 JSON：
[
  {
    "title": "任务标题（简洁明了）",
    "description": "任务详细描述（可选）",
    "priority": "high/medium/low",
    "dueDate": "2024-12-31" // 可选，ISO 8601 格式 YYYY-MM-DD
  }
]

注意：
- priority 只能是 high、medium 或 low 三个值之一
- dueDate 必须是 YYYY-MM-DD 格式，如果无法确定则不返回此字段`

export async function decomposeTask(userInput: string): Promise<TaskSuggestion[]> {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('Missing MINIMAX_API_KEY environment variable')
  }

  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // MiniMax 可能需要 X-API-Key header
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01', // 使用 MiniMax 的文本模型
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ] as MiniMaxMessage[],
      temperature: 0.7,
    }),
  })

  console.log('[MiniMax] Response status:', response.status)
  const responseText = await response.text()
  console.log('[MiniMax] Response text:', responseText)

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${responseText}`)
  }

  const data = JSON.parse(responseText)
  console.log('[MiniMax] Parsed response keys:', Object.keys(data))
  console.log('[MiniMax] Full response:', JSON.stringify(data, null, 2))

  if (!data.choices || data.choices.length === 0) {
    console.error('[MiniMax] No choices in response:', data)
    throw new Error('No choices in MiniMax response')
  }

  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in MiniMax response')
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
      dueDate: task.dueDate || undefined,
    }))
  } catch (parseError) {
    console.error('Failed to parse MiniMax response:', content)
    throw new Error('Failed to parse AI response')
  }
}
