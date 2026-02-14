'use client'

import { useEffect, useRef } from 'react'

interface CommentInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  replyPrefix?: string | null
  submitting?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function CommentInput({
  placeholder = '写下你的评论...',
  value,
  onChange,
  onSubmit,
  onCancel,
  replyPrefix,
  submitting = false,
  inputRef,
}: CommentInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !submitting) {
        onSubmit()
      }
    }
  }

  useEffect(() => {
    if (replyPrefix && inputRef?.current) {
      inputRef.current.focus()
    }
  }, [replyPrefix, inputRef])

  return (
    <div className="mb-6">
      {replyPrefix && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-t-md text-sm text-muted-foreground">
          <span>{replyPrefix}</span>
          <button
            type="button"
            className="ml-auto bg-none border-none cursor-pointer text-lg leading-none hover:text-foreground transition-colors"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
      )}
      <textarea
        ref={inputRef}
        className="w-full p-3 border border-input rounded-b-md text-sm font-inherit resize-vertical focus:outline-none focus:ring-2 focus:ring-ring/10 transition-shadow"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={submitting}
      />
      <button
        type="button"
        className="mt-2 px-4 py-1.5 bg-primary text-primary-foreground border-none rounded-md text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSubmit}
        disabled={!value.trim() || submitting}
      >
        {submitting ? '发送中...' : '发送'}
      </button>
    </div>
  )
}

export default CommentInput
