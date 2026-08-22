import { supabase, signOutCompletely } from './supabase'

export type Role = 'student' | 'recruiter' | 'tpo'

export interface Profile {
  id: string
  role: Role
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  branch: string | null
  cgpa: number | null
  api_score: number | null
  ssi_score: number | null
  prs_score: number | null
}

/** Create a brand new account with email + password. Role/name are stored
 *  as auth metadata and mirrored into the `profiles` table by a DB trigger
 *  (see supabase/schema.sql), with a client-side upsert as a safety net. */
export async function signUpWithEmail(email: string, password: string, name: string, role: Role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  })
  if (error) throw error

  if (data.user) {
    try {
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, email, name, role }, { onConflict: 'id' })
    } catch (e) {
      console.warn('Profile upsert warning:', e)
    }
  }
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Kicks off the Supabase OAuth redirect. The chosen role is stashed in
 *  localStorage so the callback page can attach it to the new profile row. */
export async function signInWithOAuth(provider: 'google' | 'github' | 'linkedin_oidc', role: Role) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('placement_ops_oauth_role', role)
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const redirectTo = `${origin}/auth/callback`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  await signOutCompletely()
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.warn('getProfile DB notice:', error.message)
      return null
    }
    return data as Profile | null
  } catch (err) {
    console.warn('getProfile error:', err)
    return null
  }
}

/** Ensures a profile row exists for the signed-in user (used mainly after
 *  an OAuth redirect, where there's no explicit sign-up step). */
export async function ensureProfile(userId: string, email: string | null, name: string, role: Role) {
  const existing = await getProfile(userId)
  if (existing) return existing
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, name, role }, { onConflict: 'id' })
      .select()
      .maybeSingle()
    if (error) {
      console.warn('ensureProfile DB notice:', error.message)
      return { id: userId, email, name, role } as Profile
    }
    return data as Profile | null
  } catch (err) {
    console.warn('ensureProfile catch:', err)
    return { id: userId, email, name, role } as Profile
  }
}
