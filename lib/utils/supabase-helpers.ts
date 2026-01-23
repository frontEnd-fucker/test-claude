import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Helper to handle real-time subscriptions
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: unknown) => void
): RealtimeChannel {
  const supabase = createClient()

  return supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      callback
    )
    .subscribe()
}

// Note: The generic CRUD helpers have been removed because they rely on
// generated database types. Use direct Supabase client queries instead.
// Example:
// const supabase = createClient()
// const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id)