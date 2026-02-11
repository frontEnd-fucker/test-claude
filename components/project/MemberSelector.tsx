'use client'

import { useState } from 'react'
import { ProjectMember } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberSelectorProps {
  members: ProjectMember[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showSearch?: boolean
  onAddMember?: () => void
  className?: string
}

export default function MemberSelector({
  members,
  value,
  onValueChange,
  placeholder = 'Select assignee',
  disabled = false,
  showSearch = false,
  onAddMember,
  className,
}: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = showSearch
    ? members.filter((member) => {
        const name = member.user?.name || ''
        const email = member.user?.email || ''
        const query = searchQuery.toLowerCase()
        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query)
        )
      })
    : members

  return (
    <div className={cn('space-y-2', className)}>
      <Select
        value={value || 'unassigned'}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {value ? (
              <div className="flex items-center gap-2">
                {(() => {
                  const member = members.find((m) => m.userId === value)
                  return (
                    <>
                      <Avatar className="h-4 w-4">
                        {member?.user?.avatarUrl ? (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={member.user.name || member.user.email}
                          />
                        ) : null}
                        <AvatarFallback className="text-[8px]">
                          {member?.user?.name?.[0]?.toUpperCase() ||
                            member?.user?.email?.[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member?.user?.name || member?.user?.email || 'Unknown User'}
                      </span>
                    </>
                  )
                })()}
              </div>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showSearch && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {onAddMember && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 justify-start"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAddMember()
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add new member
                </Button>
              )}
            </div>
          )}

          <SelectItem value="unassigned">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">?</span>
              </div>
              <span className="text-muted-foreground">Unassigned</span>
            </div>
          </SelectItem>

          {filteredMembers.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No members found
            </div>
          ) : (
            filteredMembers.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-4 w-4">
                    {member.user?.avatarUrl ? (
                      <AvatarImage
                        src={member.user.avatarUrl}
                        alt={member.user.name || member.user.email}
                      />
                    ) : null}
                    <AvatarFallback className="text-[8px]">
                      {member.user?.name?.[0]?.toUpperCase() ||
                        member.user?.email?.[0]?.toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{member.user?.name || member.user?.email || 'Unknown User'}</span>
                    {member.user?.email && member.user.name && (
                      <span className="text-xs text-muted-foreground">
                        {member.user.email}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}