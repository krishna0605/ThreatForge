import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('DEBUG: NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.log('DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (hidden)' : 'Not Set')
}

// Fallback to avoid crash during build/dev if variables are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)
