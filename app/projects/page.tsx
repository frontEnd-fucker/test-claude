import { Metadata } from 'next'
import Head from 'next/head'
import { AuthGuard } from '@/components/auth/AuthGuard'
import ProjectList from '@/components/projects/ProjectList'

export const metadata: Metadata = {
  title: 'Projects - Vibe Coders',
  description: 'Manage your projects and organize tasks, todos, and notes',
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <Head>
        <link
          rel="prefetch"
          as="script"
          href="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
        />
        <link
          rel="prefetch"
          as="script"
          href="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"
        />
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProjectList />
      </div>
    </AuthGuard>
  )
}