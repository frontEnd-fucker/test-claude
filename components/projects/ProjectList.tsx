'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProjects, useProjectSubscriptions } from '@/lib/queries/projects'
import { AlertCircle, FolderPlus, Search, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProjectCard from './ProjectCard'
import ProjectForm from './ProjectForm'
import { ProjectSearch } from './ProjectSearch'
import { CardSkeleton } from '@/components/ui/skeleton/index'

export default function ProjectList() {
  // Set up real-time subscriptions for projects
  useProjectSubscriptions()

  // URL for search query synchronization
  const searchParams = useSearchParams()

  // Get initial search query from URL parameter 'q'
  const initialSearchQuery = searchParams.get('q') || ''

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)

  // State for showing success banner
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // Track previous search query and data to detect when search completes
  const prevSearchQueryRef = useRef(initialSearchQuery)
  const prevIsFetchingRef = useRef(false) // Assume not fetching initially
  const prevProjectsRef = useRef<unknown[]>([]) // Empty array initially

  // Fetch projects using TanStack Query with search query
  const { data: projects = [], isLoading, isFetching, error, refetch } = useProjects(searchQuery)

  // Update URL when search query changes
  useEffect(() => {
    // Skip initial render
    if (searchQuery === initialSearchQuery) {
      return
    }

    const params = new URLSearchParams(window.location.search)

    if (searchQuery.trim()) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }

    // Update URL directly using history.replaceState to avoid page refresh
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    const newFullUrl = `${window.location.pathname}${newUrl}`

    window.history.replaceState(
      { ...window.history.state, as: newFullUrl, url: newFullUrl },
      '',
      newFullUrl
    )
  }, [searchQuery, initialSearchQuery])

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const currentQuery = params.get('q') || ''
      if (currentQuery !== searchQuery) {
        setSearchQuery(currentQuery)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [searchQuery])

  // Detect when search completes and show success banner
  useEffect(() => {
    // Hide success banner when search query changes (new search starting)
    if (prevSearchQueryRef.current !== searchQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccessBanner(false)
    }

    // Check if search just completed (was fetching, now not fetching, and has search query)
    const searchJustCompleted = prevIsFetchingRef.current && !isFetching && searchQuery

    // Only show success banner if we found projects (not for empty results)
    if (searchJustCompleted && projects.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccessBanner(true)

      // Auto-hide success banner after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Update refs for next render
    prevSearchQueryRef.current = searchQuery
    prevIsFetchingRef.current = isFetching
    prevProjectsRef.current = projects
  }, [isFetching, searchQuery, projects])

  // Only show skeleton on initial load when there's no search query
  // Don't show skeleton during search to prevent UI flickering and focus loss
  if (isLoading && projects.length === 0 && !searchQuery) {
    return (
      <div className="space-y-6">
        {/* 头部骨架图 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-80 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>

        {/* 项目卡片骨架图网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
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

  // Calculate UI states for search
  const showLoadingOverlay = isFetching && searchQuery
  const showEmptyState = !isFetching && projects.length === 0
  const showSearchLoading = showLoadingOverlay && projects.length === 0

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

      {/* Search component */}
      <ProjectSearch
        value={searchQuery}
        onChange={setSearchQuery}
        disabled={isLoading && projects.length === 0 && !searchQuery}
      />

      {/* Search status banners */}
      <div className="space-y-3">
        {/* Searching banner */}
        {showLoadingOverlay && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-blue-800">
                  Searching for projects matching &quot;{searchQuery}&quot;...
                </span>
              </div>
              <span className="text-xs text-blue-600 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Showing previous results
              </span>
            </div>
          </div>
        )}

        {/* Search success banner */}
        {showSuccessBanner && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Found {projects.length} project{projects.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </span>
              </div>
              <span className="text-xs text-green-600">
                Results updated
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Results count - shown for all non-empty states except during initial search loading */}
      {!showEmptyState && !showSearchLoading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {searchQuery ? (
              <>
                {showLoadingOverlay ? (
                  <>
                    Found <span className="font-semibold text-foreground">{projects.length}</span> project{projects.length !== 1 ? 's' : ''} (previous results)
                  </>
                ) : (
                  <>
                    Found <span className="font-semibold text-foreground">{projects.length}</span> project{projects.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                  </>
                )}
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-foreground">{projects.length}</span> project{projects.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
      )}

      {/* Empty state */}
      {showEmptyState && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          {searchQuery ? (
            // No search results state
            <>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matching projects found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No projects match your search &quot;{searchQuery}&quot;. Try different keywords or create a new project.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
                <ProjectForm
                  buttonText="Create New Project"
                  buttonVariant="default"
                  showIcon={true}
                />
              </div>
            </>
          ) : (
            // No projects at all state
            <>
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
            </>
          )}
        </div>
      )}

      {/* Search loading state - when searching but no projects available yet */}
      {showSearchLoading && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="h-12 w-12 mb-4 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Searching projects</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Searching for projects matching &quot;{searchQuery}&quot;...
            </p>
          </div>
        </div>
      )}

      {/* Projects grid - shown when there are projects */}
      {projects.length > 0 && (
        <div className="relative">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${showLoadingOverlay ? 'opacity-50 pointer-events-none' : ''}`}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}