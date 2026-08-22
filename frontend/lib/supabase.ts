import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://fvnwqeumcxifqjqovemg.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bndxZXVtY3hpZnFqcW92ZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNTkzODAsImV4cCI6MjEwMjkzNTM4MH0.tpyi3tlW_RUZTwQAqj8K7nfxD6weLrF_QUMR8hsML7c'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const supabaseUrl = (envUrl && !envUrl.includes('your-project') && !envUrl.includes('placeholder'))
  ? envUrl
  : DEFAULT_SUPABASE_URL

export const supabaseAnonKey = (envAnonKey && !envAnonKey.includes('your-supabase') && !envAnonKey.includes('placeholder'))
  ? envAnonKey
  : DEFAULT_SUPABASE_ANON_KEY

// Configuration check: true when valid project credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('your-supabase') &&
  !supabaseAnonKey.includes('placeholder')
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})

export async function signOutCompletely() {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Supabase signout error:', e)
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('placement_ops_token')
    localStorage.removeItem('placement_ops_user')
    localStorage.removeItem('placement_ops_demo_user')
    localStorage.removeItem('placement_ops_oauth_role')
  }
}
