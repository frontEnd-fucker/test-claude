'use client'

import { useState, useRef, useEffect } from 'react'

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
    <div className="comment-input">
      {replyPrefix && (
        <div className="comment-input-prefix">
          <span>{replyPrefix}</span>
          <button
            type="button"
            className="comment-input-cancel"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
      )}
      <textarea
        ref={inputRef}
        className="comment-input-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={submitting}
      />
      <button
        type="button"
        className="comment-input-submit"
        onClick={onSubmit}
        disabled={!value.trim() || submitting}
      >
        {submitting ? '发送中...' : '发送'}
      </button>
    </div>
  )
}
