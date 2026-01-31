'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditableFieldProps {
  value: string
  onSave: (value: string) => void
  type?: 'text' | 'textarea' | 'select'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
}

export default function InlineEditableField({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  className,
  disabled = false,
  isLoading = false,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [tempValue, setTempValue] = useState(value)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
    setTempValue(value)
  }, [value])

  const handleStartEdit = () => {
    if (disabled || isLoading) return
    setTempValue(localValue)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (tempValue !== localValue) {
      onSave(tempValue)
      setLocalValue(tempValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(localValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('relative', className)}>
        {type === 'textarea' ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className="min-h-[100px] pr-10"
            disabled={isLoading}
          />
        ) : type === 'select' ? (
          <Select
            value={tempValue}
            onValueChange={setTempValue}
            disabled={isLoading}
          >
            <SelectTrigger className="pr-10">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className="pr-10"
            disabled={isLoading}
          />
        )}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            title="Save (Enter)"
          >
            <Check className="h-3 w-3 text-green-600" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            title="Cancel (Esc)"
          >
            <X className="h-3 w-3 text-red-600" />
          </button>
        </div>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={handleStartEdit}
      className={cn(
        'cursor-text rounded-lg border border-transparent hover:border-input p-2 transition-colors',
        !localValue && 'text-muted-foreground italic',
        className
      )}
    >
      {localValue || placeholder}
      {isLoading && (
        <Loader2 className="ml-2 h-3 w-3 animate-spin text-muted-foreground inline" />
      )}
    </div>
  )
}