'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { AITaskPreview } from './AITaskPreview'
import { TaskSuggestion, MAX_INPUT_LENGTH } from '@/lib/ai/deepseek'
import { useAIUsage } from '@/lib/queries/ai/useAIUsage'
import { cn, formatNumber } from '@/lib/utils'

interface AITaskInputProps {
  projectId: string
}

const QUOTA_WARNING_THRESHOLD = 5000 // 剩余配额低于此值显示警告

export function AITaskInput({ projectId }: AITaskInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TaskSuggestion[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: usageData, isLoading: isLoadingUsage } = useAIUsage()

  const remainingQuota = usageData?.remaining ?? null
  const dailyLimit = usageData?.dailyLimit ?? 50000
  const usedToday = usageData?.usedToday ?? 0

  // 计算配额使用比例
  const quotaUsedPercent = dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 0

  const handleDecompose = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/decompose-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to decompose task')
      }

      const data = await response.json()
      setSuggestions(data.tasks)
      // 刷新配额数据
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setSuggestions(null)
    setError(null)
  }

  const handleTasksAdded = () => {
    setInput('')
    setSuggestions(null)
  }

  const isInputTooLong = input.length > MAX_INPUT_LENGTH
  const isQuotaExhausted = remainingQuota !== null && remainingQuota <= 0
  const isQuotaLow = remainingQuota !== null && remainingQuota < QUOTA_WARNING_THRESHOLD && remainingQuota > 0
  const canSubmit = input.trim() && !isInputTooLong && !isQuotaExhausted && !isLoading

  return (
    <div className="space-y-4">
      {/* 配额使用情况 */}
      {!isLoadingUsage && remainingQuota !== null && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">AI 配额：</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  isQuotaExhausted ? 'bg-red-500' : isQuotaLow ? 'bg-amber-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(100, quotaUsedPercent)}%` }}
              />
            </div>
            <span className={cn(
              'tabular-nums',
              isQuotaExhausted ? 'text-red-500 font-medium' : isQuotaLow ? 'text-amber-600' : 'text-foreground'
            )}>
              {formatNumber(remainingQuota)} / {formatNumber(dailyLimit)}
            </span>
          </div>

          {/* 配额警告提示 */}
          {isQuotaLow && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                AI 配额即将用完，剩余 {formatNumber(remainingQuota)} tokens
              </p>
            </div>
          )}

          {/* 配额耗尽提示 */}
          {isQuotaExhausted && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                今日 AI 配额已用完，请明天再试。
              </p>
            </div>
          )}
        </div>
      )}

      {!suggestions ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="描述你的需求，AI 将自动拆分成可执行的任务..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={cn(
                'min-h-[80px] resize-none',
                isInputTooLong && 'border-red-500 focus-visible:ring-red-500'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
                  handleDecompose()
                }
              }}
            />
          </div>

          {/* 字符计数器 */}
          <p className={cn(
            'text-xs text-right',
            isInputTooLong ? 'text-red-500 font-medium' : 'text-muted-foreground'
          )}>
            {input.length}/{MAX_INPUT_LENGTH}
          </p>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDecompose}
              disabled={!canSubmit}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 拆分中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 拆分
                </>
              )}
            </Button>
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            按 Ctrl+Enter 或点击按钮生成任务建议
          </p>
        </div>
      ) : (
        <AITaskPreview
          tasks={suggestions}
          projectId={projectId}
          onClose={handleClear}
          onTasksAdded={handleTasksAdded}
        />
      )}
    </div>
  )
}
