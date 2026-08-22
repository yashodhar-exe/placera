'use client'

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode
} from 'react'
import { supabase, isSupabaseConfigured, signOutCompletely } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'recruiter' | 'tpo'

export interface UserProfile {
  id: string | number
  name: string
  email: string
  role: UserRole
  company?: string
  branch?: string
  cgpa?: number
  api_score?: number
  ssi_score?: number
  prs_score?: number
  profile_image?: string | null
}

export interface AuthUser {
  token: string
  role: UserRole
  user: UserProfile
}

interface AuthContextValue {
  authUser: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore + validate session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        // First try to restore from localStorage
        const savedUser = localStorage.getItem('placement_ops_user')
        const savedToken = localStorage.getItem('placement_ops_token')

        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser) as AuthUser

          // If Supabase is configured, validate the stored token
          if (isSupabaseConfigured) {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error || !session) {
              // Session expired or invalid — clear storage
              await signOutCompletely()
              setIsLoading(false)
              return
            }
            // Update token if refreshed
            if (session.access_token !== savedToken) {
              localStorage.setItem('placement_ops_token', session.access_token)
              parsed.token = session.access_token
            }
          }

          setAuthUser(parsed)
        }
      } catch (e) {
        console.error('Session restore failed:', e)
        await signOutCompletely()
      } finally {
        setIsLoading(false)
      }
    }

    restore()

    // Listen for Supabase auth state changes (token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          localStorage.removeItem('placement_ops_token')
          localStorage.removeItem('placement_ops_user')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem('placement_ops_token', session.access_token)
          setAuthUser(prev => prev ? { ...prev, token: session.access_token } : prev)
        } else if (event === 'SIGNED_IN' && session) {
          // Handled by login() — don't double-set here
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback((user: AuthUser) => {
    localStorage.setItem('placement_ops_token', user.token)
    localStorage.setItem('placement_ops_user', JSON.stringify(user))
    setAuthUser(user)
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await signOutCompletely()
    } finally {
      setAuthUser(null)
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      authUser,
      isLoading,
      isAuthenticated: Boolean(authUser),
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
