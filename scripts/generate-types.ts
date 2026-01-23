#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase database schema
 *
 * There are two ways to generate types:
 *
 * 1. Using Supabase Dashboard (Recommended):
 *    - Go to https://supabase.com/dashboard/project/ksbfxyehciksotcteqtc/settings/api
 *    - Scroll to "Generate TypeScript types" section
 *    - Click "Generate TypeScript types" button
 *    - Copy the generated types
 *    - Paste into lib/supabase/types.ts
 *
 * 2. Using Supabase CLI (Requires login):
 *    - Run: supabase login
 *    - Follow authentication steps
 *    - Then run: npx supabase gen types typescript --project-id ksbfxyehciksotcteqtc > lib/supabase/types.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log(`
=== Supabase TypeScript Type Generation ===

Your Supabase project is configured with:
- Project ID: ksbfxyehciksotcteqtc
- URL: https://ksbfxyehciksotcteqtc.supabase.co

Choose one of the following methods to generate TypeScript types:

METHOD 1: Using Supabase Dashboard (Recommended)
1. Open your browser and go to:
   https://supabase.com/dashboard/project/ksbfxyehciksotcteqtc/settings/api
2. Scroll down to the "Generate TypeScript types" section
3. Click the "Generate TypeScript types" button
4. Copy the generated TypeScript definitions
5. Replace the contents of lib/supabase/types.ts with the copied code

METHOD 2: Using Supabase CLI
1. Install Supabase CLI if not already installed: npm install supabase --save-dev
2. Login to Supabase CLI: npx supabase login
3. Follow the authentication steps in your browser
4. Generate types: npx supabase gen types typescript --project-id ksbfxyehciksotcteqtc > lib/supabase/types.ts

=== Important Notes ===

- The generated types are required for full TypeScript type safety
- Without proper types, you may see TypeScript errors in the stores
- After generating types, restart your development server: npm run dev

=== Current Status ===
`)

const typesPath = path.join(__dirname, '..', 'lib', 'supabase', 'types.ts')

if (fs.existsSync(typesPath)) {
  const content = fs.readFileSync(typesPath, 'utf8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length <= 5) {
    console.log('⚠ Types file exists but appears to be empty or placeholder')
    console.log('  You need to generate proper types from your Supabase database')
  } else {
    console.log('✓ Types file appears to contain generated types')
    console.log(`  File size: ${content.length} characters, ${lines.length} lines`)
  }
} else {
  console.log('✗ Types file not found at:', typesPath)
}

console.log(`
=== Next Steps ===

1. Generate types using one of the methods above
2. Verify the application compiles: npx tsc --noEmit
3. Start the development server: npm run dev
4. Test authentication and data operations

For help, refer to: https://supabase.com/docs/guides/api/rest/generating-types
`)