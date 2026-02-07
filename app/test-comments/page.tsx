'use client'

import { CommentsSection } from '@/components/comments'

export default function TestCommentsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Comments Feature Test</h1>
      <p className="text-muted-foreground mb-8">
        This page tests the comments functionality. You can test both task and project comments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Task Comments Test */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Task Comments</h2>
          <p className="text-sm text-muted-foreground">
            Test comments for a specific task. Replace the taskId with an actual task ID from your database.
          </p>
          <div className="border rounded-lg p-4">
            <CommentsSection taskId="17219dc6-029c-49dc-8c0c-c16dafb05215" />
          </div>
        </div>

        {/* Project Comments Test */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Project Comments</h2>
          <p className="text-sm text-muted-foreground">
            Test comments for a project. Replace the projectId with an actual project ID from your database.
          </p>
          <div className="border rounded-lg p-4">
            <CommentsSection projectId="67412923-bbc8-413a-a29c-bc21412a2575" />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Replace the taskId/projectId with actual IDs from your database</li>
          <li>Log in with a user who has appropriate permissions</li>
          <li>Test creating comments and replies</li>
          <li>Test editing and deleting comments</li>
          <li>Verify permissions work correctly (viewer vs member)</li>
        </ul>
      </div>
    </div>
  )
}