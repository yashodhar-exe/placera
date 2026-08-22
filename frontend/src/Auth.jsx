import { useState } from 'react'

const API_BASE = "http://localhost:8000/api"

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('student') // 'student' or 'tpo'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = isLogin ? '/auth/login' : '/auth/signup'
    const payload = isLogin ? { email, password } : { name, email, password, role }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      // Success! Pass token and user details up to App.jsx
      onAuthSuccess({
        token: data.token,
        role: data.role,
        student_id: data.student_id,
        name: data.name
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>Placera</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="text-secondary text-sm mt-xs">
            {isLogin ? 'Enter your details to sign in.' : 'Get started with AI-driven placements.'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #ffcdd2' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isLogin && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: role === 'student' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)', borderRadius: '8px', background: role === 'student' ? 'var(--surface-container-low)' : 'transparent' }}>
                <input type="radio" name="role" checked={role === 'student'} onChange={() => setRole('student')} style={{ display: 'none' }} />
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: role === 'student' ? 'var(--primary)' : 'var(--secondary)' }}>person</span>
                <span style={{ fontSize: '14px', fontWeight: role === 'student' ? 'bold' : 'normal' }}>Student</span>
              </label>
              
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: role === 'tpo' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)', borderRadius: '8px', background: role === 'tpo' ? 'var(--surface-container-low)' : 'transparent' }}>
                <input type="radio" name="role" checked={role === 'tpo'} onChange={() => setRole('tpo')} style={{ display: 'none' }} />
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: role === 'tpo' ? 'var(--primary)' : 'var(--secondary)' }}>admin_panel_settings</span>
                <span style={{ fontSize: '14px', fontWeight: role === 'tpo' ? 'bold' : 'normal' }}>TPO</span>
              </label>
            </div>
          )}

          {!isLogin && role === 'student' && (
            <div className="d-flex flex-col gap-xs">
              <label className="text-sm font-bold">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="John Doe"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>
          )}

          <div className="d-flex flex-col gap-xs">
            <label className="text-sm font-bold">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <div className="d-flex flex-col gap-xs">
            <label className="text-sm font-bold">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ padding: '12px', borderRadius: '8px', marginTop: '8px', fontSize: '16px', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="text-sm text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}
