"use client";

import { useState } from "react";
import { ProjectMember } from "@/types/database";
import {
  useRemoveProjectMember,
  useUpdateProjectMember,
} from "@/lib/queries/members/useProjectMembers";
import {
  canManageMembers,
  getRoleDisplayName,
  getRoleColor,
} from "@/lib/permissions/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, UserMinus, UserCog, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembersListProps {
  members: ProjectMember[];
  currentUserMember: ProjectMember | null;
  compact?: boolean;
  isOwner?: boolean;
}

export default function MembersList({
  members,
  currentUserMember,
  compact = false,
  isOwner = false,
}: MembersListProps) {
  const removeMemberMutation = useRemoveProjectMember();
  const updateMemberMutation = useUpdateProjectMember();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const canManage = isOwner || canManageMembers(currentUserMember);

  const handleRoleChange = (
    memberId: string,
    newRole: ProjectMember["role"]
  ) => {
    updateMemberMutation.mutate(
      { memberId, updates: { role: newRole } },
      {
        onSuccess: () => {
          setEditingMemberId(null);
        },
      }
    );
  };

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate(memberId);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Members ({members.length})</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div key={member.id} className="relative group">
              <Avatar className="h-8 w-8 border-2 border-background">
                {member.user?.avatarUrl ? (
                  <AvatarImage
                    src={member.user.avatarUrl}
                    alt={member.user.name || member.user.email}
                  />
                ) : null}
                <AvatarFallback className="text-xs">
                  {member.user?.name?.[0]?.toUpperCase() ||
                    member.user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <Badge
                  className={cn(
                    "h-3 w-3 p-0 text-[8px] flex items-center justify-center",
                    getRoleColor(member.role)
                  )}
                  title={getRoleDisplayName(member.role)}
                >
                  {member.role[0].toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Project Members ({members.length})
        </h3>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                {member.user?.avatarUrl ? (
                  <AvatarImage
                    src={member.user.avatarUrl}
                    alt={member.user.name || member.user.email}
                  />
                ) : null}
                <AvatarFallback>
                  {member.user?.name?.[0]?.toUpperCase() ||
                    member.user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.user?.name || member.user?.email || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.user?.email && member.user.name
                    ? member.user.email
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editingMemberId === member.id ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value: ProjectMember["role"]) =>
                      handleRoleChange(member.id, value)
                    }
                    disabled={updateMemberMutation.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMemberId(null)}
                    disabled={updateMemberMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Badge className={getRoleColor(member.role)}>
                  {getRoleDisplayName(member.role)}
                </Badge>
              )}

              {canManage && member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setEditingMemberId(member.id)}
                      disabled={updateMemberMutation.isPending}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      {(removeMemberMutation.isPending || updateMemberMutation.isPending) && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
}
