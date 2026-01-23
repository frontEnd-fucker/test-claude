'use client'

import { useProjects, useProjectSubscriptions } from '@/lib/queries/projects'
import { Loader2, AlertCircle, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProjectCard from './ProjectCard'
import ProjectForm from './ProjectForm'

export default function ProjectList() {
  // Set up real-time subscriptions for projects
  useProjectSubscriptions()

  // Fetch projects using TanStack Query
  const { data: projects = [], isLoading, error, refetch } = useProjects()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Failed to load projects</h3>
          <p className="text-muted-foreground mb-4">
            {(error as Error).message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects and organize tasks, todos, and notes
          </p>
        </div>
        <ProjectForm
          buttonText="New Project"
          buttonVariant="default"
          showIcon={true}
        />
      </div>

      {projects.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first project to organize tasks, todos, and notes
          </p>
          <ProjectForm
            buttonText="Create First Project"
            buttonVariant="default"
            showIcon={true}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}