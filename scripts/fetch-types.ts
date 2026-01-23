#!/usr/bin/env node

/**
 * Script to fetch TypeScript types from Supabase API
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

let supabaseUrl = ''
let anonKey = ''

for (const line of envContent.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    anonKey = line.split('=')[1].trim()
  }
}

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase URL or anon key in .env.local')
  process.exit(1)
}

console.log('Attempting to fetch TypeScript types from Supabase API...')
console.log(`URL: ${supabaseUrl}`)

// Try different endpoints
const endpoints = [
  '/rest/v1/',
  '/rest/v1/?apikey=' + anonKey,
  '/auth/v1/',
  '/'
]

// First, let's try the approach suggested in the dashboard
console.log('\nThe recommended approach is to use the Supabase Dashboard:')
console.log('1. Go to https://supabase.com/dashboard/project/ksbfxyehciksotcteqtc/settings/api')
console.log('2. Scroll to "Generate TypeScript types" section')
console.log('3. Click "Generate TypeScript types" button')
console.log('4. Copy the generated types')
console.log('5. Replace lib/supabase/types.ts with the copied content\n')

console.log('Alternatively, you can:')
console.log('1. Generate an access token at https://supabase.com/dashboard/account/tokens')
console.log('2. Set it as SUPABASE_ACCESS_TOKEN environment variable')
console.log('3. Run: npx supabase gen types typescript --project-id ksbfxyehciksotcteqtc > lib/supabase/types.ts\n')

// Check if we have a database connection string
const serviceRoleKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
if (serviceRoleKeyMatch) {
  const serviceRoleKey = serviceRoleKeyMatch[1].trim()
  console.log('Service role key found. Note: This is not an access token for the CLI.')
  console.log('Access tokens start with "sbp_" while service role keys are JWT tokens.\n')
}

const outputPath = path.join(__dirname, '..', 'lib', 'supabase', 'types.ts')

if (fs.existsSync(outputPath)) {
  const currentContent = fs.readFileSync(outputPath, 'utf8')
  console.log(`Current types file size: ${currentContent.length} characters`)

  // Check if it's our placeholder
  if (currentContent.includes('Run `npm run db:types` for instructions')) {
    console.log('File contains placeholder content - needs to be replaced with generated types.')
  } else {
    console.log('File appears to contain generated types.')
  }
} else {
  console.log('Types file does not exist.')
}

console.log('\nTo proceed with manual generation:')
console.log('1. Open the dashboard link above')
console.log('2. Generate and copy the types')
console.log('3. Run: cp lib/supabase/types.ts lib/supabase/types.ts.backup')
console.log('4. Replace lib/supabase/types.ts with the generated types')
console.log('5. Test with: npx tsc --noEmit')