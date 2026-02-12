'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles } from 'lucide-react'
import { AITaskPreview } from './AITaskPreview'
import { TaskSuggestion } from '@/lib/ai/miniMax'

interface AITaskInputProps {
  projectId: string
}

export function AITaskInput({ projectId }: AITaskInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TaskSuggestion[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-4">
      {!suggestions ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="描述你的需求，AI 将自动拆分成可执行的任务..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleDecompose()
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDecompose}
              disabled={isLoading || !input.trim()}
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
