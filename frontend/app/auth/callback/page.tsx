'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ensureProfile, type Role } from '@/lib/auth'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying authentication credentials...')
  const [errorDetails, setErrorDetails] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        let authUser: any = null

        // Completes PKCE flow started by supabase.auth.signInWithOAuth(...)
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (data?.session?.user) {
          authUser = data.session.user
        } else {
          // Fallback if session was already detected via detectSessionInUrl
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData?.session?.user) {
            authUser = sessionData.session.user
          } else if (error) {
            throw error
          }
        }

        if (!authUser) throw new Error('No user returned from the identity provider.')

        // Attach the role picked before the redirect (defaults to "student").
        const role = (localStorage.getItem('placement_ops_oauth_role') as Role | null) || 'student'
        const displayName =
          authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || 'New user'

        await ensureProfile(authUser.id, authUser.email ?? null, displayName, role)
        localStorage.removeItem('placement_ops_oauth_role')

        setStatus('success')
        setMessage('Authentication successful!')
        setTimeout(() => router.push('/'), 900)
      } catch (err: any) {
        setStatus('error')
        setMessage('Login failed')
        setErrorDetails(err?.message || 'Unable to complete sign-in with the identity provider.')
      }
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#0d121f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-6 py-6">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">{message}</h2>
              <p className="text-sm text-gray-400 mt-2">Securing your session, please hold on.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-6 py-6 motion-safe:animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-emerald-400">{message}</h2>
              <p className="text-sm text-gray-400 mt-2">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-6 py-6">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-rose-400">{message}</h2>
              <p className="text-xs text-rose-200/80 bg-rose-950/40 border border-rose-900/60 p-3 rounded-lg mt-4 font-mono">
                {errorDetails}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 transition-all rounded-lg text-xs font-semibold"
            >
              Back to Login Gate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
