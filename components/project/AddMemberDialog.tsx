"use client";

import { useState, useEffect } from "react";
import { useSearchUsers } from "@/lib/queries/users/useUsers";
import { useAddProjectMember } from "@/lib/queries/members/useProjectMembers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Loader2, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddMemberDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function AddMemberDialog({
  projectId,
  trigger,
  onSuccess,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "viewer">("member");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Option B: Clear message when dialog opens
  // useEffect(() => {
  //   if (open) {
  //     setMessage(null);
  //   }
  // }, [open]);

  const { data: searchResults = [], isLoading: isSearching } =
    useSearchUsers(email);
  const addMemberMutation = useAddProjectMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);

    if (!selectedUserId && !isEmailValid) {
      // Neither user selected nor valid email
      return;
    }

    addMemberMutation.mutate(
      {
        projectId,
        userId: selectedUserId || undefined,
        email: !selectedUserId ? email : undefined,
        role
      },
      {
        onSuccess: () => {
          // Option A: Close dialog immediately with toast (current implementation)
          setOpen(false);
          setEmail("");
          setSelectedUserId(null);
          setRole("member");
          onSuccess?.();

          // Option B: Show inline success message and close after delay
          // setMessage({ text: 'Member added successfully', type: 'success' });
          // setTimeout(() => {
          //   setOpen(false);
          //   setEmail("");
          //   setSelectedUserId(null);
          //   setRole("member");
          //   setMessage(null);
          //   onSuccess?.();
          // }, 1500);
        },
        onError: (error) => {
          // Option A: Error shown via toast (handled in hook)
          // Option B: Show inline error message
          // setMessage({
          //   text: error instanceof Error ? error.message : 'Failed to add member',
          //   type: 'error'
          // });
        },
      }
    );
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setSelectedUserId(null);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Email validation for direct input
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const canSubmit = selectedUserId || isEmailValid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Project Member</DialogTitle>
            <DialogDescription>
              Add an existing user to this project by searching for their email
              address.
            </DialogDescription>
          </DialogHeader>

          {/* Option B: Inline feedback message (uncomment to use)
          {message && (
            <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}
          */}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                />
              </div>
              {email.length > 0 && email.length < 2 && (
                <p className="text-sm text-muted-foreground">
                  Enter at least 2 characters to search
                </p>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {searchResults.length > 0 && !selectedUserId && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <Button
                      key={user.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleSelectUser(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatarUrl ? (
                            <AvatarImage
                              src={user.avatarUrl}
                              alt={user.name || user.email}
                            />
                          ) : null}
                          <AvatarFallback>
                            {user.name?.[0]?.toUpperCase() ||
                              user.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {user.name || "Unknown User"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct email option */}
            {!selectedUserId && isEmailValid && email.length >= 2 && (
              <div className="space-y-2">
                <Label>Or use email directly</Label>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {email[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Invite via email</span>
                        <span className="text-sm text-muted-foreground">
                          {email}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // User chooses to use email directly
                        // No need to set selectedUserId, canSubmit will be true
                      }}
                    >
                      Use this email
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This user will be invited to join the project via email.
                  </p>
                </div>
              </div>
            )}

            {selectedUserId && (
              <div className="space-y-2">
                <Label>Selected User</Label>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {(() => {
                          const user = searchResults.find(
                            (u) => u.id === selectedUserId
                          );
                          return user?.avatarUrl ? (
                            <AvatarImage
                              src={user.avatarUrl}
                              alt={user.name || user.email}
                            />
                          ) : null;
                        })()}
                        <AvatarFallback>
                          {(() => {
                            const user = searchResults.find(
                              (u) => u.id === selectedUserId
                            );
                            return (
                              user?.name?.[0]?.toUpperCase() ||
                              user?.email[0]?.toUpperCase()
                            );
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {(() => {
                            const user = searchResults.find(
                              (u) => u.id === selectedUserId
                            );
                            return user?.name || user?.email || "Unknown User";
                          })()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(() => {
                            const user = searchResults.find(
                              (u) => u.id === selectedUserId
                            );
                            return user?.email;
                          })()}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUserId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: "member" | "admin" | "viewer") =>
                  setRole(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Members can create and edit tasks. Admins can also manage
                members.
              </p>
            </div>
          </div>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
