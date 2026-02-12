# Project Rules

## API Route and Business Logic Separation

### 1. Server-side API Routes (`app/api/`)
- Handle request/response formatting
- Input validation and authentication checks
- Call business logic functions from `lib/queries/`
- Return standardized JSON responses with proper error handling

### 2. Business Logic (`lib/queries/`)
- Contains all database operations
- Implements core business logic (CRUD, batch operations, etc.)
- Returns typed objects (convert snake_case to camelCase)
- **MUST NOT** contain API route code (NextRequest/NextResponse)

### 3. Client-side Mutations (`lib/queries/**/use*Mutations.ts`)
- React Query mutations for client components
- Optimistic updates for better UX
- Error handling with toast notifications
- Cache invalidation in `onSettled`

### 4. Naming Conventions

| Location | Pattern | Example |
|----------|---------|---------|
| API file | `lib/queries/{entity}/api.ts` | `lib/queries/tasks/api.ts` |
| Mutation hook | `lib/queries/{entity}/use*Mutations.ts` | `lib/queries/tasks/useTaskMutations.ts` |
| Query keys | `lib/queries/{entity}/query-keys.ts` | `lib/queries/tasks/query-keys.ts` |
| Index export | `lib/queries/{entity}/index.ts` | `lib/queries/tasks/index.ts` |
| API route | `app/api/{entity}/batch/route.ts` | `app/api/tasks/batch/route.ts` |

### 5. Implementation Pattern

```typescript
// lib/queries/tasks/api.ts
export async function createTasksBatch(
  tasks: Array<{ title: string; ... }>
): Promise<Task[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Business logic here...

  return newTasks.map(task => ({
    id: task.id,
    title: task.title,
    // ... camelCase conversion
  }))
}

// app/api/tasks/batch/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tasks } = body

    const result = await createTasksBatch(tasks)
    return NextResponse.json({ tasks: result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
```

### 6. Export Pattern
All exports must be available from `lib/queries/{entity}/index.ts`:
```typescript
export * from './api'
export * from './query-keys'
export * from './useTasks'
export * from './useTaskMutations'
// ...
```
