import { Metadata } from 'next'
import { AuthGuard } from '@/components/auth/AuthGuard'
import ProjectList from '@/components/projects/ProjectList'

export const metadata: Metadata = {
  title: 'Projects - Vibe Coders',
  description: 'Manage your projects and organize tasks, todos, and notes',
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProjectList />
      </div>
    </AuthGuard>
  )
}