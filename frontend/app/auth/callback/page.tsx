'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'

const BACKEND_URL = 'http://localhost:8000';

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying authentication credentials...')
  const [errorDetails, setErrorDetails] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    // We can infer the provider from URL or saved state, but Google/GitHub/LinkedIn might return different parameters, or we can get it from state.
    // Let's retrieve the saved OAuth state and role from localStorage
    const savedState = localStorage.getItem('placement_ops_oauth_state')
    const savedProvider = localStorage.getItem('placement_ops_oauth_provider') || 'google'
    const savedRole = localStorage.getItem('placement_ops_oauth_role') || 'student'

    if (!code) {
      setStatus('error')
      setMessage('Authentication failed')
      setErrorDetails('Missing authorization code from provider.')
      return
    }

    // Verify state to protect against CSRF
    if (savedState && state !== savedState) {
      setStatus('error')
      setMessage('Security verification failed')
      setErrorDetails('OAuth state mismatch. The request might have been intercepted.')
      return
    }

    const performCallbackExchange = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/oauth-callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: savedProvider,
            code,
            state: state || '',
            role: savedRole,
            redirect_uri: `${window.location.origin}/auth/callback`
          })
        })

        if (res.ok) {
          const data = await res.json()
          
          // Store authentication details in localStorage
          localStorage.setItem('placement_ops_token', data.token)
          localStorage.setItem('placement_ops_user', JSON.stringify({
            role: data.role,
            user: data.user
          }))

          // Clear temporary OAuth state
          localStorage.removeItem('placement_ops_oauth_state')
          localStorage.removeItem('placement_ops_oauth_provider')
          localStorage.removeItem('placement_ops_oauth_role')

          setStatus('success')
          setMessage('Authentication successful!')
          
          // Redirect to home page
          setTimeout(() => {
            router.push('/')
          }, 1000)
        } else {
          const errData = await res.json()
          setStatus('error')
          setMessage('Login failed')
          setErrorDetails(errData.detail || 'The authentication server rejected the request.')
        }
      } catch (err: any) {
        setStatus('error')
        setMessage('Network error')
        setErrorDetails('Unable to connect to the backend server. Please verify the backend is running.')
      }
    }

    performCallbackExchange()
  }, [searchParams, router])

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
