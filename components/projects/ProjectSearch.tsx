'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProjectSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function ProjectSearchComponent({
  value,
  onChange,
  placeholder = 'Search projects by name or description...',
  className,
  disabled = false,
}: ProjectSearchProps) {
  const [inputValue, setInputValue] = useState(value)

  // Sync external value prop to internal state
  useEffect(() => {
    if (value !== inputValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]) // Only sync when external value changes

  // Debounce the input value to avoid too many API calls
  useEffect(() => {
    // Only trigger onChange if inputValue is different from current external value
    if (inputValue === value) {
      return
    }

    const timer = setTimeout(() => {
      onChange(inputValue)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [inputValue, onChange, value])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    },
    []
  )

  const handleClear = useCallback(() => {
    setInputValue('')
    onChange('')
  }, [onChange])

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          inputMode="search"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Search will match project names and descriptions
      </p>
    </div>
  )
}

export const ProjectSearch = React.memo(ProjectSearchComponent)