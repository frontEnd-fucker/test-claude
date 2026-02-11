import Link from 'next/link'
import { ArrowLeft, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TaskNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <FileX className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold mb-3">Task Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The task you're looking for doesn't exist or you don't have permission to view it.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Button asChild>
          <Link href="/projects">
            Browse Projects
          </Link>
        </Button>
      </div>
    </div>
  )
}