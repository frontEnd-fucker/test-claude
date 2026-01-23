#!/usr/bin/env node

/**
 * Database Setup Script for Vibe Coders Supabase Integration
 *
 * This script provides instructions for setting up the Supabase database.
 * Since we cannot automate Supabase setup without credentials, we provide
 * step-by-step instructions.
 */

console.log(`
=== Supabase Database Setup Instructions ===

1. Go to https://supabase.com and create a new project or use an existing one.

2. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy your "Project URL" (NEXT_PUBLIC_SUPABASE_URL)
   - Copy your "anon public" key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Copy your "service_role" key (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!

3. Update your .env.local file with these values:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

4. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of lib/supabase/schema.sql
   - Paste into the SQL Editor and run it

5. Verify the tables were created:
   - Go to Table Editor in your Supabase dashboard
   - You should see: projects, tasks, todos, notes tables

6. Generate TypeScript types:
   - Install Supabase CLI: npm install supabase --save-dev
   - Run: npx supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
   - Alternatively, use the Supabase dashboard: Go to Settings > API > Generate Types

7. Test the connection:
   - Start your Next.js app: npm run dev
   - Visit /auth/register to create an account
   - Verify you can create tasks, todos, and notes

=== Troubleshooting ===

- If you get authentication errors, verify your environment variables
- If tables don't appear, check the SQL execution for errors
- If RLS policies prevent access, verify you're signed in and policies are correct
- For real-time subscriptions, ensure you've enabled replication on tables

=== Next Steps ===

After setting up the database, you need to:
1. Update your Zustand stores to use Supabase instead of localStorage
2. Update components to handle loading states and errors
3. Implement real-time subscriptions if desired
4. Add proper error handling and user feedback

For more details, refer to the implementation plan.
`)

// Check if .env.local exists
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✓ .env.local file exists')
} else {
  console.log('⚠ .env.local file not found - create one with Supabase credentials')
}

const schemaPath = path.join(__dirname, '..', 'lib', 'supabase', 'schema.sql')
if (fs.existsSync(schemaPath)) {
  console.log('✓ Database schema file exists:', schemaPath)
} else {
  console.log('⚠ Database schema file not found')
}