import { Metadata } from 'next'
import Script from 'next/script'
import { AuthGuard } from '@/components/auth/AuthGuard'
import ProjectList from '@/components/projects/ProjectList'

export const metadata: Metadata = {
  title: 'Projects - Vibe Coders',
  description: 'Manage your projects and organize tasks, todos, and notes',
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      {/* 预加载 Chart.js 库以优化时间线组件的加载性能 */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"
        strategy="lazyOnload"
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProjectList />
      </div>
    </AuthGuard>
  )
}
