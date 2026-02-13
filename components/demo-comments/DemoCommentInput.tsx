'use client'

import { useState, useRef, useEffect } from 'react'

interface DemoCommentInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  replyPrefix?: string | null
  submitting?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function DemoCommentInput({
  placeholder = '写下你的评论...',
  value,
  onChange,
  onSubmit,
  onCancel,
  replyPrefix,
  submitting = false,
  inputRef,
}: DemoCommentInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !submitting) {
        onSubmit()
      }
    }
  }

  // 当 replyPrefix 变化时聚焦输入框
  useEffect(() => {
    if (replyPrefix && inputRef?.current) {
      inputRef.current.focus()
    }
  }, [replyPrefix, inputRef])

  return (
    <div className="demo-comment-input">
      {replyPrefix && (
        <div className="demo-comment-input-prefix">
          <span>{replyPrefix}</span>
          <button
            type="button"
            className="demo-comment-input-cancel"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
      )}
      <textarea
        ref={inputRef}
        className="demo-comment-input-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={submitting}
      />
      <button
        type="button"
        className="demo-comment-input-submit"
        onClick={onSubmit}
        disabled={!value.trim() || submitting}
      >
        {submitting ? '发送中...' : '发送'}
      </button>
    </div>
  )
}
