'use client'

import { useState, useEffect } from 'react'
import { useCreateProject, useUpdateProject } from '@/lib/queries/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Project } from '@/types'

interface ProjectFormProps {
  project?: Project
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  onSubmit?: (projectData: { name: string; description?: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export default function ProjectForm({
  project,
  buttonText = 'Add Project',
  buttonVariant = 'default',
  buttonSize = 'default',
  showIcon = true,
  onSubmit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger = false,
}: ProjectFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()

  // Sync form data when project changes
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
    }
  }, [project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (onSubmit) {
      onSubmit({ name, description })
    } else if (project) {
      // Edit mode
      updateProjectMutation.mutate({
        id: project.id,
        updates: { name, description },
      })
    } else {
      // Create mode
      createProjectMutation.mutate({
        name,
        description,
      })
    }

    if (!project) {
      // Only reset form for new projects
      setName('')
      setDescription('')
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize}>
            {showIcon && <Plus className={`h-4 w-4 ${buttonText ? 'mr-2' : ''}`} />}
            {buttonText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? 'Update Project' : 'Create Project'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}