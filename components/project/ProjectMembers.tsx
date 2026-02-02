'use client'

import { useProjectMembers } from '@/lib/queries/members/useProjectMembers'
import { useCurrentUser } from '@/lib/queries/users/useUsers'
import { useProjectMemberByUserId } from '@/lib/queries/members/useProjectMembers'
import { canManageMembers } from '@/lib/permissions/project'
import MembersList from '@/components/project/MembersList'
import AddMemberDialog from '@/components/project/AddMemberDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Loader2 } from 'lucide-react'
import { useProject } from '@/lib/queries/projects'

interface ProjectMembersProps {
  projectId: string
  compact?: boolean
}

export default function ProjectMembers({ projectId, compact = false }: ProjectMembersProps) {
  const { data: members = [], isLoading: isLoadingMembers } = useProjectMembers(projectId)
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()
  const { data: project, isLoading: isLoadingProject } = useProject(projectId)

  const { data: currentUserMember, isLoading: isLoadingMember } = useProjectMemberByUserId(
    projectId,
    currentUser?.id || ''
  )

  const currentUserMemberOrNull = currentUserMember || null

  const isLoading = isLoadingMembers || isLoadingUser || isLoadingMember || isLoadingProject
  const isOwner = project?.userId === currentUser?.id
  const canManage = isOwner || canManageMembers(currentUserMemberOrNull)

  if (isLoading) {
    if (compact) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Members ({members.length})</h3>
          {canManage && (
            <AddMemberDialog
              projectId={projectId}
              trigger={
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <UserPlus className="h-3 w-3" />
                </Button>
              }
            />
          )}
        </div>
        <MembersList
          members={members}
          currentUserMember={currentUserMemberOrNull}
          compact={true}
          isOwner={isOwner}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Members ({members.length})</h3>
        {canManage && (
          <AddMemberDialog
            projectId={projectId}
            trigger={
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            }
          />
        )}
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No members yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add members to collaborate on this project.
          </p>
          {canManage && (
            <AddMemberDialog
              projectId={projectId}
              trigger={
                <Button className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <MembersList
          members={members}
          currentUserMember={currentUserMemberOrNull}
          compact={false}
          isOwner={isOwner}
        />
      )}
    </div>
  )
}