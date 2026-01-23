import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-muted p-6">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Project Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The project you're looking for doesn't exist or you don't have permission to access it.
            It may have been deleted or moved.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}