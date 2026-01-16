import KanbanBoard from '@/components/kanban/Board'
import TodoList from '@/components/sidebar/TodoList'
import NotesEditor from '@/components/notes/NotesEditor'

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar with Todo List */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-neon-green" />
              Quick Tasks
            </h2>
            <TodoList />
          </div>
        </div>
      </div>

      {/* Main Kanban Board */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-neon-cyan" />
            Project Board
            <span className="text-sm font-normal text-muted-foreground">
              Drag and drop tasks between columns
            </span>
          </h2>
          <KanbanBoard />
        </div>
      </div>

      {/* Notes Area */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-neon-purple" />
              Notes
            </h2>
            <NotesEditor />
          </div>
        </div>
      </div>
    </div>
  )
}
