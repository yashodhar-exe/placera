'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, ClipboardCheck, Clock3, FileText, Filter, Gauge, GraduationCap,
  LayoutDashboard, Menu, Moon, MoreHorizontal, MoveRight, Pencil, Plus, Search, Settings,
  Sparkles, Target, Upload, Users, X, Zap, BookOpen, BarChart3, Building2, Send, RotateCcw,
  FileSpreadsheet, Mail, Trash2, ShieldAlert, Phone, Lock, LogOut, Key, Landmark
} from 'lucide-react'

// Backend base URL
const BACKEND_URL = 'http://localhost:8000';
import { supabase, isSupabaseConfigured } from '../lib/supabase'


function StatusBadge({ tone = 'neutral', children }: { tone?: 'good' | 'danger' | 'warn' | 'neutral'; children: React.ReactNode }) {
  return <span className={`status-badge ${tone}`}><span className="status-dot" />{children}</span>
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'teal' }: { label: string; value: string; detail: string; icon: React.ElementType; tone?: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`icon-box ${tone}`}><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>
}

function Button({ children, variant = 'primary', onClick, className = '', disabled = false, type = 'button' }: { children: React.ReactNode; variant?: 'primary'|'outline'|'quiet'|'coral'; onClick?: () => void; className?: string; disabled?: boolean; type?: 'button'|'submit' }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{children}</button>
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function Why({ children }: { children: React.ReactNode }) { return <div className="why"><CircleHelp size={14} /> <span>{children}</span></div> }

// ----------------------------------------------------
// CONNECTION BANNER ASSISTANT
// ----------------------------------------------------
function ConnectionAssistant({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  return (
    <div className="bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 motion-page">
      <div className="flex gap-3">
        <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <strong className="block text-sm font-semibold text-white">Local Placement Ops Backend Offline</strong>
          <span className="text-xs text-red-300">The application is running in mock mode. To connect to PostgreSQL and run the AI agents:</span>
          <pre className="mt-2 text-[10px] font-mono bg-black/40 p-2 rounded border border-red-900/60 overflow-x-auto text-green-300">
            $env:PYTHONPATH="." ; .venv\Scripts\uvicorn backend.main:app --port 8000
          </pre>
        </div>
      </div>
      <Button variant="outline" className="text-xs border-red-800 text-red-300 hover:bg-red-900/40" onClick={() => window.location.reload()}>
        Retry Connection <RotateCcw size={13} />
      </Button>
    </div>
  );
}

// ----------------------------------------------------
// MAIN WRAPPER COMPONENT
// ----------------------------------------------------
export default function Page() {
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  const [user, setUser] = useState<any>(null);

  // Check if session exists in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('placement_ops_user');
    const token = localStorage.getItem('placement_ops_token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setView('app');
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    }
  }, []);

  // Intercept window.fetch to attach token automatically
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const token = localStorage.getItem('placement_ops_token');
      if (token) {
        init = init || {};
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
          init.headers.set('Authorization', `Bearer ${token}`);
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
          if (!hasAuth) {
            init.headers.push(['Authorization', `Bearer ${token}`]);
          }
        } else {
          if (!init.headers['Authorization'] && !init.headers['authorization']) {
            init.headers['Authorization'] = `Bearer ${token}`;
          }
        }
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleLoginSuccess = (loginUser: any) => {
    if (loginUser.token) {
      localStorage.setItem('placement_ops_token', loginUser.token);
    }
    localStorage.setItem('placement_ops_user', JSON.stringify({
      role: loginUser.role,
      user: loginUser.user
    }));
    setUser(loginUser);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('placement_ops_token');
    localStorage.removeItem('placement_ops_user');
    setUser(null);
    setView('landing');
  };

  return (
    <>
      {view === 'landing' && <Landing onOpen={() => setView('login')} />}
      {view === 'login' && <LoginGate onLoginSuccess={handleLoginSuccess} onBack={() => setView('landing')} />}
      {view === 'app' && <Dashboard user={user} onLogout={handleLogout} />}
    </>
  );
}

// ----------------------------------------------------
// LANDING PAGE SCREEN
// ----------------------------------------------------
function Landing({ onOpen }: { onOpen: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(email.includes('@') ? 'You are on the early access list.' : 'Enter a valid work email.');
  }

  return (
    <main className="landing motion-page">
      <nav className="landing-nav">
        <div className="brand"><span className="brand-mark"><Zap size={15} /></span> placement ops</div>
        <div className="nav-links">
          <a href="#agents">Agents</a>
          <a href="#results">Results</a>
          <a href="#get-started">Get started</a>
        </div>
        <Button onClick={onOpen}>Open dashboard <ArrowRight size={15} /></Button>
      </nav>
      <section className="hero">
        <div className="hero-copy reveal reveal-copy">
          <div className="kicker"><span className="live-pulse" /> AI-assisted placement operations</div>
          <h1>Move every campus drive forward, <em>with confidence.</em></h1>
          <p>Placement Ops turns the busywork behind recruitment into a clear, auditable workflow. Your team stays in control at every decision point.</p>
          <div className="hero-actions">
            <Button onClick={onOpen}>Explore the workspace <ArrowRight size={16} /></Button>
            <a className="text-link" href="#agents">See how it works <MoveRight size={16} /></a>
          </div>
        </div>
        <div className="hero-visual reveal reveal-visual">
          <div className="mock-window">
            <div className="mock-bar">
              <span className="mock-dots"><i /><i /><i /></span>
              <span className="mono">placement-ops / dashboard</span>
              <MoreHorizontal size={16} />
            </div>
            <div className="mock-content">
              <div className="mock-header">
                <div>
                  <span className="mini-label">Tuesday, 8 October 2026</span>
                  <h3>Good morning, Maya</h3>
                </div>
                <StatusBadge tone="good">Live systems normal</StatusBadge>
              </div>
              <div className="mock-metrics">
                <div><span>Active drives</span><strong>06</strong></div>
                <div><span>Eligible this week</span><strong>1,284</strong></div>
                <div><span>Top-50 match rate</span><strong>92%</strong></div>
              </div>
              <div className="mock-row">
                <div><span className="mini-label">Acme Systems · Software engineer</span><strong>Shortlist ready for review</strong></div>
                <div className="score-pill">94 <small>match</small></div>
              </div>
              <div className="mock-row faded">
                <div><span className="mini-label">TechCorp · Data analyst</span><strong>Schedule conflict detected</strong></div>
                <StatusBadge tone="danger">Needs review</StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="pipeline">
        <span className="pipeline-label">One connected flow</span>
        {['JD intake','Eligibility','Matching','Scheduling','Coordination','Notify'].map((item, i) => (
          <div className="pipeline-step" key={item}>
            <span>{String(i+1).padStart(2,'0')}</span>{item}{i < 5 && <ChevronRight size={14} />}
          </div>
        ))}
      </div>
      <section className="stats-strip" id="results">
        {[['15h → 3h','admin time per drive'],['<2s','shortlist generation'],['92%','top-50 match rate'],['0','selections automated']].map(([v,l]) => (
          <div key={l}><strong>{v}</strong><span>{l}</span></div>
        ))}
      </section>
      <section className="content-section" id="agents">
        <div className="center-title">
          <div className="eyebrow">The operating layer</div>
          <h2>Nine agents. One calm command center.</h2>
          <p>Purpose-built workflows that remove coordination drag without hiding the reasoning behind a recommendation.</p>
        </div>
        <div className="agent-grid">
          {agents.map(([num, title, desc, Icon]) => (
            <div className="agent-card" key={title as string}>
              <div className="agent-number">{num}</div>
              <Icon size={19} className="text-primary" />
              <h3>{title as string}</h3>
              <p>{desc as string}</p>
              <ChevronRight size={16} className="agent-arrow" />
            </div>
          ))}
        </div>
      </section>
      <section className="proof-section">
        <div>
          <div className="eyebrow">Built for the busy season</div>
          <h2>Less chasing. More placement.</h2>
          <p>“The difference is not another dashboard. It is knowing exactly what needs my attention and why.”</p>
          <div className="quote-person">
            <span className="avatar coral-bg">NS</span>
            <div><strong>Neha Sharma</strong><span>TPO, Northbridge Institute</span></div>
          </div>
        </div>
        <div className="proof-metrics">
          <div><span>Before</span><strong>15.2h</strong><small>admin work / drive</small></div>
          <div className="proof-arrow"><ArrowRight /></div>
          <div className="highlight"><span>With Placement Ops</span><strong>3.1h</strong><small>admin work / drive</small></div>
        </div>
      </section>
      <section className="signup" id="get-started">
        <div>
          <div className="eyebrow">Get early access</div>
          <h2>Make your next drive the smoothest one yet.</h2>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="email">Your work email</label>
          <div className="form-row">
            <input id="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@university.edu" type="email" />
            <Button>Join the waitlist <ArrowRight size={15} /></Button>
          </div>
          {message && <div className={message.includes('valid') ? 'form-error' : 'form-success'}>{message}</div>}
        </form>
      </section>
      <footer>
        <div className="brand"><span className="brand-mark"><Zap size={15} /></span> placement ops</div>
        <span>Human-led. AI-assisted.</span>
      </footer>
    </main>
);
}

// ----------------------------------------------------
// SCREEN 2: AUTHENTICATION / LOGIN GATE
// ----------------------------------------------------
function LoginGate({ onLoginSuccess, onBack }: { onLoginSuccess: (user: any) => void; onBack: () => void }) {
  const [role, setRole] = useState<'student' | 'recruiter' | 'tpo'>('tpo');
  const [tpoMethod, setTpoMethod] = useState<'google' | 'number' | 'mail'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMockQuickLogin, setUseMockQuickLogin] = useState(false);
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Designated Head of Placements (TPO) for ease of testing
  const tpoHeads = [
    { name: 'Maya Chen', email: 'maya.chen@placement.edu', phone: '+919999911111' },
    { name: 'Rajesh Kumar', email: 'rajesh.kumar@placement.edu', phone: '+919999922222' },
    { name: 'Sunita Rao', email: 'sunita.rao@placement.edu', phone: '+919999933333' }
  ];

  // Sync default emails when role shifts
  useEffect(() => {
    if (role === 'tpo') {
      setEmail(tpoHeads[0].email);
    } else if (role === 'student') {
      setEmail('aditya.sharma@example.com');
    } else {
      setEmail('');
    }
    setError('');
  }, [role]);

  const handleSocialAction = async (provider: 'google' | 'linkedin' | 'github') => {
    setLoading(true);
    setError('');
    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    // Save oauth temporary state
    localStorage.setItem('placement_ops_oauth_provider', provider);
    localStorage.setItem('placement_ops_oauth_role', role);
    localStorage.setItem('placement_ops_oauth_state', state);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/oauth-url?provider=${provider}&role=${role}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('placement_ops_oauth_state', data.state);
        window.location.href = data.url;
      } else {
        throw new Error("Failed to get OAuth url from backend.");
      }
    } catch (err) {
      console.warn("Backend offline or error fetching OAuth url. Falling back to local callback redirect.");
      setTimeout(() => {
        window.location.href = `/auth/callback?code=mock-code-${provider}-${Date.now()}&state=${state}`;
      }, 800);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isSignUp ? '/auth/register' : '/auth/login-email';
    const body = isSignUp 
      ? { name, email, password, role }
      : { email, password };

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Authentication failed.');
      }
    } catch (err) {
      setError('Unable to reach backend database. Please run the backend or use Demo Mock login.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: any = {
      role,
      auth_method: role === 'tpo' ? tpoMethod : 'google',
      email: role === 'student' ? (email || 'aditya.sharma@example.com') : email,
      phone,
      otp,
      google_token: 'mock-oauth-token-xyz'
    };

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data);
      } else {
        setError("Mock login verification rejected.");
      }
    } catch (err) {
      console.log("Mocking login response since backend is offline.");
      const mailValue = email || (role === 'student' ? 'aditya.sharma@example.com' : 'recruiter@acme.com');
      const nameValue = role === 'student' ? 'Aditya Sharma' : role === 'recruiter' ? 'Acme Systems Recruiter Partner' : 'Maya Chen';
      
      if (role === 'student') {
        onLoginSuccess({
          role: 'student',
          user: { id: 1, name: nameValue, email: mailValue, branch: 'CSE', cgpa: 9.2, api_score: 91.2, ssi_score: 80.0, prs_score: 75.0 }
        });
      } else if (role === 'recruiter') {
        onLoginSuccess({
          role: 'recruiter',
          user: { name: nameValue, email: mailValue, company: 'Acme Systems' }
        });
      } else {
        const chosen = tpoHeads.find(x => x.email === mailValue || x.phone === phone) || tpoHeads[0];
        onLoginSuccess({
          role: 'tpo',
          user: chosen
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 motion-page">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
        <button className="absolute top-4 left-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold" onClick={onBack}>
          <RotateCcw size={12} /> Back
        </button>

        <div className="text-center mt-6 mb-6">
          <span className="brand-mark inline-grid place-items-center mb-2"><Zap size={18} /></span>
          <h2 className="text-xl font-bold tracking-tight">Placement Ops Portal Gate</h2>
          <p className="text-xs text-muted-foreground mt-1">Authenticate into your specialized recruitment view</p>
        </div>

        {/* Toggle sign in / sign up */}
        <div className="bg-muted/40 p-1 rounded-lg flex gap-1 mb-4 text-xs font-semibold">
          <button type="button" className={`flex-1 py-1.5 rounded-md text-center transition-all ${!isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => { setIsSignUp(false); setError(''); setUseMockQuickLogin(false); }}>
            Sign In
          </button>
          <button type="button" className={`flex-1 py-1.5 rounded-md text-center transition-all ${isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => { setIsSignUp(true); setError(''); setUseMockQuickLogin(false); }}>
            Sign Up
          </button>
        </div>

        {/* Roles Cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button type="button" className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${role === 'student' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`} onClick={() => { setRole('student'); }}>
            <Users size={16} />
            <span className="text-[10px] font-mono font-bold uppercase">Student</span>
          </button>
          <button type="button" className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${role === 'recruiter' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`} onClick={() => { setRole('recruiter'); }}>
            <Building2 size={16} />
            <span className="text-[10px] font-mono font-bold uppercase">Recruiter</span>
          </button>
          <button type="button" className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${role === 'tpo' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`} onClick={() => { setRole('tpo'); }}>
            <Landmark size={16} />
            <span className="text-[10px] font-mono font-bold uppercase">TPO (Head)</span>
          </button>
        </div>

        {/* Brand Social Providers */}
        <div className="space-y-2 mb-6">
          <div className="text-[10px] font-mono text-muted-foreground uppercase text-center mb-2">
            Continue with secure identity provider
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialAction('google')}
              className="w-full flex items-center justify-center gap-3 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] text-[#3c4043] rounded-lg py-2.5 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialAction('linkedin')}
              className="w-full flex items-center justify-center gap-3 bg-[#0077b5] hover:bg-[#006297] text-white rounded-lg py-2.5 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              Continue with LinkedIn
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialAction('github')}
              className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1a1e22] text-white rounded-lg py-2.5 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-[10px] font-mono uppercase"><span className="bg-card px-2 text-muted-foreground">Or direct credentials</span></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 text-red-200 text-xs rounded-xl flex items-start gap-2.5 motion-safe:animate-shake">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {!useMockQuickLogin ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aditya Sharma"
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold focus:border-primary focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Email Address</label>
              <input
                required
                type="email"
                placeholder={role === 'student' ? 'aditya.sharma@example.com' : role === 'recruiter' ? 'partner@acme.com' : 'maya.chen@placement.edu'}
                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold focus:border-primary focus:outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold focus:border-primary focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <Button variant="primary" className="w-full py-2.5 mt-2 text-xs flex justify-center items-center gap-2 font-semibold" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : isSignUp ? `Create Account as ${role.toUpperCase()}` : `Sign In as ${role.toUpperCase()}`} <ArrowRight size={14}/>
            </Button>

            {!isSignUp && (
              <button
                type="button"
                className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground mt-2 border border-dashed border-border py-1.5 rounded-lg transition-all"
                onClick={() => setUseMockQuickLogin(true)}
              >
                Switch to Quick Demo Login
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleMockLoginSubmit} className="space-y-4">
            {role === 'tpo' && (
              <div className="bg-muted/40 p-1 rounded-lg flex gap-1 mb-4 text-xs">
                <button type="button" className={`flex-1 py-1 rounded-md text-center ${tpoMethod === 'google' ? 'bg-card font-semibold text-foreground' : 'text-muted-foreground'}`} onClick={() => { setTpoMethod('google'); setEmail(tpoHeads[0].email); }}>
                  Google
                </button>
                <button type="button" className={`flex-1 py-1 rounded-md text-center ${tpoMethod === 'number' ? 'bg-card font-semibold text-foreground' : 'text-muted-foreground'}`} onClick={() => { setTpoMethod('number'); setPhone(tpoHeads[0].phone); }}>
                  Number
                </button>
                <button type="button" className={`flex-1 py-1 rounded-md text-center ${tpoMethod === 'mail' ? 'bg-card font-semibold text-foreground' : 'text-muted-foreground'}`} onClick={() => { setTpoMethod('mail'); setEmail(tpoHeads[0].email); }}>
                  Mail
                </button>
              </div>
            )}

            {role === 'student' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Select Student Demo Profile</label>
                <select className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs" value={email} onChange={e => setEmail(e.target.value)}>
                  <option value="aditya.sharma@example.com">Aditya Sharma (aditya.sharma@example.com)</option>
                  <option value="rohan.verma@example.com">Rohan Verma (rohan.verma@example.com)</option>
                  <option value="sneha.patil@example.com">Sneha Patil (sneha.patil@example.com)</option>
                  <option value="pooja.rao@example.com">Pooja Rao (pooja.rao@example.com)</option>
                </select>
              </div>
            )}

            {role === 'recruiter' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Recruiter Registered Email</label>
                <input required type="email" className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold" placeholder="e.g. partner@acme.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            )}

            {role === 'tpo' && tpoMethod === 'google' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Select TPO Head Account</label>
                <select className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs mb-3 font-semibold" value={email} onChange={e => setEmail(e.target.value)}>
                  {tpoHeads.map(head => (
                    <option key={head.email} value={head.email}>{head.name} ({head.email})</option>
                  ))}
                </select>
                <div className="bg-muted/20 border border-border p-3 rounded-lg flex items-center gap-3 text-xs text-muted-foreground">
                  <Sparkles size={16} className="text-primary shrink-0" />
                  <span>Simulates Google OAuth single sign-on redirect flow.</span>
                </div>
              </div>
            )}

            {role === 'tpo' && tpoMethod === 'number' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">TPO Phone Number</label>
                  <select className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold" value={phone} onChange={e => setPhone(e.target.value)}>
                    {tpoHeads.map(head => (
                      <option key={head.phone} value={head.phone}>{head.name} ({head.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Enter OTP code</label>
                  <input required type="text" maxLength={6} className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-mono text-center tracking-widest" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} />
                </div>
              </div>
            )}

            {role === 'tpo' && tpoMethod === 'mail' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">TPO Email Address</label>
                  <select className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-semibold" value={email} onChange={e => setEmail(e.target.value)}>
                    {tpoHeads.map(head => (
                      <option key={head.email} value={head.email}>{head.name} ({head.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Magic Password Key</label>
                  <input required type="password" value="********" readOnly className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground text-xs font-mono" />
                </div>
              </div>
            )}

            <Button variant="primary" className="w-full py-2.5 mt-2 text-xs flex justify-center items-center gap-2 font-semibold" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : `Authorize Mock Session`} <ArrowRight size={14}/>
            </Button>

            <button
              type="button"
              className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground mt-2 border border-dashed border-border py-1.5 rounded-lg transition-all"
              onClick={() => setUseMockQuickLogin(false)}
            >
              Switch to Email & Password Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
// ----------------------------------------------------
function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const userRole = user?.role || 'tpo';
  const profile = user?.user || {};

  const [active, setActive] = useState('dashboard');
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  
  // Shared global state for active recruitment drive
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [exceptionsCount, setExceptionsCount] = useState<number>(0);

  // Ping backend to check if online
  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then(res => res.json())
      .then(data => setIsOnline(true))
      .catch(err => setIsOnline(false));
  }, [active]);

  // Load drives and exceptions count
  useEffect(() => {
    if (!isOnline) {
      setDrives([
        { id: 1, company_name: "Acme Systems", role_title: "Software Engineer", status: "published", stage: "matching", created_at: "2026-08-20T10:00:00Z", cgpa_cutoff: 8.0 },
        { id: 2, company_name: "TechCorp", role_title: "Data Analyst", status: "draft", stage: "intake", created_at: "2026-08-21T09:00:00Z", cgpa_cutoff: 7.5 },
        { id: 3, company_name: "Northstar Labs", role_title: "Product Intern", status: "published", stage: "eligibility", created_at: "2026-08-19T08:30:00Z", cgpa_cutoff: 7.0 },
        { id: 4, company_name: "FinEdge", role_title: "Backend Developer", status: "closed", stage: "completed", created_at: "2026-08-15T14:00:00Z", cgpa_cutoff: 8.0 }
      ]);
      setExceptionsCount(2);
      setSelectedDriveId(1);
      return;
    }

    // Fetch real drives
    fetch(`${BACKEND_URL}/drives`)
      .then(res => res.json())
      .then(data => {
        setDrives(data);
        if (data.length > 0 && selectedDriveId === null) {
          setSelectedDriveId(data[0].id);
        }
      })
      .catch(err => console.error(err));

    // Fetch exceptions count
    fetch(`${BACKEND_URL}/exceptions`)
      .then(res => res.json())
      .then(data => {
        const activeExc = data.filter((x: any) => !x.resolved).length;
        setExceptionsCount(activeExc);
      })
      .catch(err => console.error(err));
  }, [isOnline, active]);

  useEffect(() => {
    // Re-route views depending on the logged in role
    if (userRole === 'student') {
      setActive('student-profile');
    } else if (userRole === 'recruiter') {
      setActive('recruiter-shortlist');
    } else {
      setActive('dashboard');
    }
  }, [userRole]);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || null;

  // Render navigation options depending on role
  const getNavItems = () => {
    if (userRole === 'student') {
      return [
        { id: 'student-profile', label: 'My Academic Profile', icon: GraduationCap },
        { id: 'student-drives', label: 'Eligible Job Drives', icon: Building2 },
        { id: 'student-interviews', label: 'My Interview Slots', icon: CalendarDays },
        { id: 'student-skillgap', label: 'My Curriculum Gaps', icon: Target }
      ];
    } else if (userRole === 'recruiter') {
      return [
        { id: 'recruiter-shortlist', label: 'Candidate Shortlist', icon: Target },
        { id: 'recruiter-schedule', label: 'Interview Panels', icon: CalendarDays },
        { id: 'recruiter-outbox', label: 'Outbox Logs', icon: Bell }
      ];
    } else {
      return [
        { id: 'dashboard', label: 'TPO Dashboard', icon: LayoutDashboard },
        { id: 'drives', label: 'Recruitment Drives', icon: Building2 },
        { id: 'eligibility', label: 'Eligibility Engine', icon: ClipboardCheck },
        { id: 'matching', label: 'Shortlists & SHAP', icon: Target },
        { id: 'scheduling', label: 'Interview Scheduler', icon: CalendarDays },
        { id: 'exceptions', label: 'Exceptions Queue', icon: AlertTriangle },
        { id: 'analytics', label: 'Skill Gaps & Trends', icon: BarChart3 },
        { id: 'notifications', label: 'Notification logs', icon: Bell },
        { id: 'reports', label: 'Post-Drive Reports', icon: FileText }
      ];
    }
  };

  // Screen selection routing
  const renderContent = () => {
    switch (active) {
      // TPO VIEWS
      case 'dashboard':
        return <DashboardHome onGo={setActive} isOnline={isOnline} drives={drives} exceptionsCount={exceptionsCount} onSelectDrive={setSelectedDriveId} />;
      case 'drives':
        return <JDIntakeScreen isOnline={isOnline} drives={drives} activeDriveId={selectedDriveId} onSelectDrive={setSelectedDriveId} onRefreshDrives={() => setIsOnline(prev => !prev)} />;
      case 'eligibility':
        return <EligibilityScreen isOnline={isOnline} activeDrive={activeDrive} drives={drives} onSelectDrive={setSelectedDriveId} />;
      case 'matching':
        return <MatchingScreen isOnline={isOnline} activeDrive={activeDrive} drives={drives} onSelectDrive={setSelectedDriveId} />;
      case 'scheduling':
        return <SchedulingScreen isOnline={isOnline} activeDrive={activeDrive} drives={drives} onSelectDrive={setSelectedDriveId} />;
      case 'exceptions':
        return <ExceptionsScreen isOnline={isOnline} onUpdateException={() => setExceptionsCount(c => Math.max(0, c - 1))} />;
      case 'analytics':
        return <AnalyticsScreen isOnline={isOnline} />;
      case 'notifications':
        return <NotificationsScreen isOnline={isOnline} />;
      case 'reports':
        return <ReportsScreen isOnline={isOnline} drives={drives} />;
      
      // STUDENT VIEWS
      case 'student-profile':
        return <StudentProfileScreen isOnline={isOnline} studentData={profile} />;
      case 'student-drives':
        return <StudentDrivesScreen isOnline={isOnline} studentData={profile} drives={drives} />;
      case 'student-interviews':
        return <StudentInterviewsScreen isOnline={isOnline} studentData={profile} />;
      case 'student-skillgap':
        return <StudentSkillGapScreen isOnline={isOnline} studentData={profile} />;

      // RECRUITER VIEWS
      case 'recruiter-shortlist':
        return <RecruiterShortlistScreen isOnline={isOnline} activeDrive={activeDrive} drives={drives} onSelectDrive={setSelectedDriveId} />;
      case 'recruiter-schedule':
        return <RecruiterScheduleScreen isOnline={isOnline} activeDrive={activeDrive} drives={drives} onSelectDrive={setSelectedDriveId} />;
      case 'recruiter-outbox':
        return <NotificationsScreen isOnline={isOnline} />;

      default:
        return <div className="p-4">Select a tab from the sidebar.</div>;
    }
  };

  return (
    <div className={`${dark ? 'app-shell dark' : 'app-shell'} motion-page`}>
      <aside className={mobileNav ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="sidebar-brand" onClick={onLogout}>
          <span className="brand-mark"><Zap size={15}/></span>
          <span>placement ops</span>
        </div>
        
        <div className="workspace-switch">
          <span className="avatar teal-bg">{profile.name ? profile.name.slice(0,2).toUpperCase() : 'PO'}</span>
          <div>
            <strong className="truncate max-w-[120px] block">{profile.name || 'Head of Placements'}</strong>
            <span className="capitalize">{userRole === 'tpo' ? 'TPO Admin' : userRole}</span>
          </div>
          <ChevronDown size={14}/>
        </div>

        <nav className="flex-1 space-y-1">
          {getNavItems().map(({id, label, icon: Icon}) => {
            const isSelected = active === id;
            return (
              <button
                key={id}
                className={isSelected ? 'nav-active w-full' : 'w-full'}
                onClick={() => { setActive(id); setMobileNav(false); }}
              >
                <Icon size={17}/>
                <span className="flex-1 text-left">{label}</span>
                {id === 'exceptions' && exceptionsCount > 0 && (
                  <span className="nav-count">{exceptionsCount}</span>
                )}
                {id === 'drives' && drives.length > 0 && (
                  <span className="nav-count bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">{drives.length}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => setDark(!dark)} className="hover:bg-muted/40 font-semibold">
            <Moon size={16}/> {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={onLogout} className="hover:bg-red-500/10 text-red-500 font-bold">
            <LogOut size={16}/> Log Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}>
            <Menu size={20}/>
          </button>
          <div className="search-box">
            <Search size={16}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drives, students, or IDs" />
          </div>
          
          <div className="top-actions">
            {activeDrive && (
              <div className="hidden md:flex items-center gap-2 mr-4 bg-muted px-3 py-1.5 rounded-lg border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Scope:</span>
                <strong className="text-xs font-semibold text-primary">{activeDrive.company_name}</strong>
              </div>
            )}
            <button className="icon-button" onClick={onLogout}>
              <LogOut size={18}/>
            </button>
            <span className="top-divider"/>
            <span className="avatar coral-bg">{profile.name ? profile.name.slice(0,2).toUpperCase() : 'MC'}</span>
          </div>
        </header>

        <main className="dashboard-main">
          {/* Connection Help Banner */}
          <ConnectionAssistant isOnline={isOnline} />
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

// ----------------------------------------------------
// ROLE SCREEN: STUDENT PROFILE
// ----------------------------------------------------
function StudentProfileScreen({ isOnline, studentData }: { isOnline: boolean; studentData: any }) {
  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Student Placement Center"
        title={`Welcome Back, ${studentData.name}`}
        description="View your verified academic grades, calculated eligibility indicators, and readiness indexes."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-5 bg-card border border-border rounded-xl text-center shadow-sm">
          <span className="text-[10px] font-mono text-muted-foreground uppercase block">Academic Score (API)</span>
          <strong className="text-3xl font-display text-primary block mt-2 font-bold">{studentData.api_score || 88.5}%</strong>
          <span className="text-xs text-muted-foreground block mt-1">Weighted CGPA, 10th & 12th marks</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl text-center shadow-sm">
          <span className="text-[10px] font-mono text-muted-foreground uppercase block">Skill Strength (SSI)</span>
          <strong className="text-3xl font-display text-amber-600 block mt-2 font-bold">{studentData.ssi_score || 75.0}%</strong>
          <span className="text-xs text-muted-foreground block mt-1">Based on advanced/intermediate skills</span>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl text-center shadow-sm">
          <span className="text-[10px] font-mono text-muted-foreground uppercase block">Readiness Score (PRS)</span>
          <strong className="text-3xl font-display text-indigo-600 block mt-2 font-bold">{studentData.prs_score || 80.0}%</strong>
          <span className="text-xs text-muted-foreground block mt-1">Projects, internships, and certifications</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="panel shadow-sm">
          <div className="panel-head">
            <h2>Academic Credentials (Verified)</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Department Branch</span>
              <strong className="text-foreground">{studentData.branch}</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Cumulative CGPA</span>
              <strong className="text-foreground font-mono">{studentData.cgpa} / 10.00</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Active Backlogs</span>
              <strong className="text-foreground font-mono">0</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">10th Class Percentage</span>
              <strong className="text-foreground font-mono">92.5%</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">12th Class Percentage</span>
              <strong className="text-foreground font-mono">89.0%</strong>
            </div>
          </div>
        </section>

        <section className="panel shadow-sm">
          <div className="panel-head">
            <h2>Verified Skill Endorsements</h2>
          </div>
          <div className="skill-tags flex flex-wrap gap-2 mb-4">
            {['Python', 'SQL', 'FastAPI', 'React', 'JavaScript', 'HTML5/CSS3'].map(skill => (
              <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary font-semibold rounded-lg" key={skill}>{skill}</span>
            ))}
          </div>
          <Why>Profile skills are synced with the institution's official laboratory registries.</Why>
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROLE SCREEN: STUDENT ELIGIBLE DRIVES
// ----------------------------------------------------
function StudentDrivesScreen({ isOnline, studentData, drives }: { isOnline: boolean; studentData: any; drives: any[] }) {
  const qualifiedDrives = drives.filter(d => studentData.cgpa >= d.cgpa_cutoff);

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Student Placement Center"
        title="Eligible Campus Recruitment Campaigns"
        description="Verify your qualification statuses and package ranges for active employer listings."
      />

      <section className="panel shadow-sm">
        <div className="panel-head">
          <h2>Active Recruiter Profiles</h2>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                <th className="p-3">Company</th>
                <th className="p-3">Target Role</th>
                <th className="p-3">Salary Package</th>
                <th className="p-3">Cutoff</th>
                <th className="p-3">Audited Status</th>
              </tr>
            </thead>
            <tbody>
              {qualifiedDrives.map(d => (
                <tr key={d.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{d.company_name}</td>
                  <td className="p-3 text-muted-foreground">{d.role_title}</td>
                  <td className="p-3 font-mono">{d.package_min} - {d.package_max} LPA</td>
                  <td className="p-3 font-mono">{d.cgpa_cutoff} CGPA</td>
                  <td className="p-3"><StatusBadge tone="good">ELIGIBLE TO APPLY</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// ROLE SCREEN: STUDENT SCHEDULED INTERVIEWS
// ----------------------------------------------------
function StudentInterviewsScreen({ isOnline, studentData }: { isOnline: boolean; studentData: any }) {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    // Simulation / load student specific interviews
    setInterviews([
      { company_name: "Acme Systems", role_title: "Software Engineer", time_slot: "2026-08-22 10:00 - 10:30", room_or_link: "Room 101", panel: "Dr. Prasad", status: "scheduled" }
    ]);
  }, []);

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Student Placement Center"
        title="Your Scheduled Assessment Timeline"
        description="Ensure punctuality. Panel locations and virtual room meeting details are published below."
      />

      <div className="space-y-4">
        {interviews.map((intr, idx) => (
          <div key={idx} className="p-5 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div>
              <span className="mini-label">{intr.time_slot}</span>
              <h3 className="text-lg font-bold mt-1 text-primary">{intr.company_name} · {intr.role_title}</h3>
              <p className="text-xs text-muted-foreground mt-2">Venue: <strong>{intr.room_or_link}</strong> | Panelist: <strong>{intr.panel}</strong></p>
            </div>
            <StatusBadge tone="good">SCHEDULED</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROLE SCREEN: STUDENT PERSONAL SKILL GAP
// ----------------------------------------------------
function StudentSkillGapScreen({ isOnline, studentData }: { isOnline: boolean; studentData: any }) {
  const missingSkills = [
    { skill: "AWS Cloud", demand: "High (3 drives)", recommendation: "Take AWS Cloud Practitioner certification. Access code available in placement library." },
    { skill: "Tableau", demand: "Medium (1 drive)", recommendation: "Review basic SQL data visualizations and workbook sharing courses." }
  ];

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Student Placement Center"
        title="Personal Curriculum Skill Gaps"
        description="The matching agent maps your profile against open recruiter JDs to suggest preparation actions."
      />

      <div className="grid grid-cols-1 gap-4">
        {missingSkills.map((gap) => (
          <div key={gap.skill} className="p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-500/30 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <strong className="text-sm text-foreground">{gap.skill}</strong>
              <StatusBadge tone="warn">{gap.demand}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{gap.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ROLE SCREEN: RECRUITER SHORTLIST REVIEW
// ----------------------------------------------------
function RecruiterShortlistScreen({ isOnline, activeDrive, drives, onSelectDrive }: { isOnline: boolean; activeDrive: any | null; drives: any[]; onSelectDrive: (id: number) => void }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!activeDrive) return;

    if (!isOnline) {
      setCandidates([
        { student_name: "Aditya Sharma", branch: "CSE", cgpa: 9.2, overall_score: 91, skill_score: 95, academic_score: 84, project_score: 90, readiness_score: 88, feature_importance: { "Skill Alignment": 18.2, "CGPA Value": 12.4, "Readiness": 8.5 } },
        { student_name: "Pooja Rao", branch: "CSE", cgpa: 9.6, overall_score: 88, skill_score: 80, academic_score: 89, project_score: 75, readiness_score: 92, feature_importance: { "Skill Alignment": 14.5, "CGPA Value": 15.2, "Readiness": 9.1 } }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/drives/${activeDrive.id}/shortlist`)
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => console.error(err));
  }, [activeDrive, isOnline]);

  if (!activeDrive) {
    return <div className="p-6 text-center">Select your active recruitment drive to view candidates.</div>;
  }

  return (
    <div className="motion-page">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="eyebrow">Recruiter Partner Console</div>
          <h1>{activeDrive.company_name} · Shortlisted Qualified Candidates</h1>
        </div>
        <select className="bg-card border border-border text-foreground text-xs p-2 rounded-lg" value={activeDrive.id} onChange={e => onSelectDrive(parseInt(e.target.value))}>
          {drives.map(d => (
            <option key={d.id} value={d.id}>{d.company_name}</option>
          ))}
        </select>
      </div>

      <section className="panel shadow-sm">
        <div className="panel-head">
          <h2>Qualified Candidates Pool</h2>
          <p>These candidates have cleared the institution's academic eligibility requirements.</p>
        </div>

        <div className="space-y-4">
          {candidates.map((c, idx) => (
            <div className="border-b border-border pb-4 last:border-0" key={idx}>
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-sm block">{c.student_name}</strong>
                  <span className="text-xs text-muted-foreground">{c.branch} · {c.cgpa} CGPA</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <strong className="text-primary text-lg block">{c.overall_score}%</strong>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">fit score</span>
                  </div>
                  <Button variant="outline" onClick={() => setExpanded(expanded === idx ? null : idx)}>
                    Explain Why
                  </Button>
                </div>
              </div>

              {expanded === idx && (
                <div className="mt-4 p-4 bg-muted/40 rounded-xl text-xs motion-page">
                  <h4 className="font-semibold mb-2">SHAP Feature Importances</h4>
                  <div className="space-y-1">
                    {Object.entries(c.feature_importance || {}).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex justify-between max-w-xs">
                        <span>{key}</span>
                        <strong className="text-emerald-600">+{val}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// ROLE SCREEN: RECRUITER INTERVIEW PANELS
// ----------------------------------------------------
function RecruiterScheduleScreen({ isOnline, activeDrive, drives, onSelectDrive }: { isOnline: boolean; activeDrive: any | null; drives: any[]; onSelectDrive: (id: number) => void }) {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (!activeDrive) return;
    if (!isOnline) {
      setInterviews([
        { student_name: "Aditya Sharma", time_slot: "2026-08-22 10:00 - 10:30", room_or_link: "Room 101", panel: "Dr. Prasad" }
      ]);
      return;
    }
    fetch(`${BACKEND_URL}/drives/${activeDrive.id}/interviews`)
      .then(res => res.json())
      .then(data => setInterviews(data.map((x: any) => ({ ...x, panel: x.panel_members.join(', ') }))))
      .catch(err => console.error(err));
  }, [activeDrive, isOnline]);

  if (!activeDrive) return <div className="p-6 text-center">Select drive to view scheduled panel timelines.</div>;

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Recruiter Partner Console"
        title="Your Scheduled Interview Timetable"
        description="Coordinate physical room locations and panel timings."
      />

      <section className="panel shadow-sm">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                <th className="p-3">Candidate</th>
                <th className="p-3">Time Slot</th>
                <th className="p-3">Interview Room</th>
                <th className="p-3">Panelists Assigned</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((intr, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="p-3 font-semibold">{intr.student_name}</td>
                  <td className="p-3 font-mono">{intr.time_slot}</td>
                  <td className="p-3">{intr.room_or_link}</td>
                  <td className="p-3">{intr.panel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// TPO SCHEDULING SCREEN INTAKE / ELIGIBILITY / MATCHING (REUSE EXISTING TPO SCRIPTS)
// ----------------------------------------------------
function DashboardHome({ onGo, isOnline, drives, exceptionsCount, onSelectDrive }: { onGo: (s: string) => void; isOnline: boolean; drives: any[]; exceptionsCount: number; onSelectDrive: (id: number) => void }) {
  const actions = [
    { id: 'approve', title: 'Approve Acme Systems shortlist', desc: 'Matching scores are computed and awaiting shortlist review', agent: 'Matching Agent', tone: 'good', tab: 'matching', driveId: 1 },
    { id: 'conflict', title: 'Resolve interview scheduling conflict', desc: 'Panel conflict double-booking detected by coordination checks', agent: 'Coordination Agent', tone: 'danger', tab: 'exceptions', driveId: 2 },
    { id: 'jd', title: 'Confirm draft drive extracting from Recruiter JD', desc: 'One parsed field requires manual validation', agent: 'JD Intake Agent', tone: 'warn', tab: 'drives', driveId: 3 }
  ];

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Tuesday, 8 October 2026"
        title="Good morning, Maya"
        description="Here is the AI campus recruiting operations status overview."
        action={
          <Button onClick={() => onGo('drives')}><Plus size={16}/> New Recruitment Drive</Button>
        }
      />

      <div className="metric-grid">
        <MetricCard label="Active Drives" value={String(drives.length).padStart(2, '0')} detail="In different stages" icon={Building2}/>
        <MetricCard label="Eligible Candidates" value="08" detail="Fully loaded from DB" icon={ClipboardCheck}/>
        <MetricCard label="Top-50 Match Rate" value="92%" detail="Weighted average compatibility" icon={Target}/>
        <MetricCard label="Open Exceptions" value={String(exceptionsCount).padStart(2, '0')} detail="Requires manual TPO override" icon={AlertTriangle} tone="coral"/>
      </div>

      <div className="dashboard-grid">
        {/* Pending Actions */}
        <section className="panel shadow-sm">
          <div className="panel-head">
            <div>
              <h2>Human-in-the-Loop Interventions</h2>
              <p>Critical checkpoints flagged for manual review.</p>
            </div>
            <StatusBadge tone={exceptionsCount > 0 ? 'warn' : 'good'}>
              {exceptionsCount > 0 ? `${exceptionsCount} actions pending` : 'All clear'}
            </StatusBadge>
          </div>
          
          <div className="action-list">
            {actions.map((act) => (
              <div className="action-card" key={act.id}>
                <span className={`action-icon ${act.tone}`}><Sparkles size={16}/></span>
                <div className="action-copy">
                  <strong>{act.title}</strong>
                  <span>{act.desc}</span>
                  <Why>{act.agent} logged this in the current session.</Why>
                </div>
                <Button variant={act.tone === 'danger' ? 'coral' : 'outline'} onClick={() => {
                  if (drives.length > 0) {
                    onSelectDrive(drives[0].id);
                  }
                  onGo(act.tab);
                }}>
                  {act.tone === 'danger' ? 'Resolve' : 'Review'} <ArrowRight size={14}/>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Live Drive Status */}
        <section className="panel shadow-sm">
          <div className="panel-head">
            <div>
              <h2>Active Pipelines</h2>
              <p>Current operational stages of recruitment drives.</p>
            </div>
            <button className="quiet-link" onClick={() => onGo('drives')}>
              View all drives <ArrowRight size={14}/>
            </button>
          </div>
          
          <div className="drive-list">
            {drives.map((drive) => {
              let tone: 'good' | 'danger' | 'warn' | 'neutral' = 'neutral';
              if (drive.stage === 'matching') tone = 'warn';
              else if (drive.stage === 'scheduling') tone = 'good';
              else if (drive.stage === 'coordination') tone = 'danger';
              else if (drive.stage === 'completed') tone = 'neutral';
              
              return (
                <div className="drive-row hover:bg-muted/20 px-2 rounded-lg cursor-pointer transition-colors" key={drive.id} onClick={() => { onSelectDrive(drive.id); onGo('drives'); }}>
                  <span className="company-avatar">{drive.company_name.slice(0,1)}</span>
                  <div>
                    <strong>{drive.company_name}</strong>
                    <span>{drive.role_title}</span>
                  </div>
                  <div className="drive-stage">
                    <StatusBadge tone={tone}>{drive.stage.toUpperCase()}</StatusBadge>
                    <span className="mono text-[10px] block mt-1 text-muted-foreground">{drive.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function JDIntakeScreen({ isOnline, drives, activeDriveId, onSelectDrive, onRefreshDrives }: { isOnline: boolean; drives: any[]; activeDriveId: number | null; onSelectDrive: (id: number) => void; onRefreshDrives: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);

  // Parsing result/draft states
  const [draftDrive, setDraftDrive] = useState<any | null>(null);
  const [parsedExplanations, setParsedExplanations] = useState<any | null>(null);
  const [confirmForm, setConfirmForm] = useState<any>({
    company_name: '', role_title: '', cgpa_cutoff: 7.0, eligible_branches: [], package_min: 5.0, package_max: 8.0, headcount: 5, required_skills: { required: [], preferred: [] }
  });

  const handleStartIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jdText) return;

    setLoading(true);
    if (!isOnline) {
      setTimeout(() => {
        const mockDraft = {
          id: 99,
          company_name: companyName,
          role_title: "Software Engineer Intern",
          cgpa_cutoff: 8.0,
          eligible_branches: ["CSE", "ISE"],
          package_min: 10.0,
          package_max: 12.0,
          headcount: 8,
          required_skills: { required: ["Python", "SQL"], preferred: ["React", "FastAPI"] },
          status: "draft",
          stage: "intake"
        };
        setDraftDrive(mockDraft);
        setConfirmForm({
          company_name: mockDraft.company_name,
          role_title: mockDraft.role_title,
          cgpa_cutoff: mockDraft.cgpa_cutoff,
          eligible_branches: mockDraft.eligible_branches,
          package_min: mockDraft.package_min,
          package_max: mockDraft.package_max,
          headcount: mockDraft.headcount,
          required_skills: mockDraft.required_skills
        });
        setParsedExplanations({
          role_title: "Identified software engineer from title heuristic.",
          cgpa_cutoff: "No explicit CGPA cutoff found. Defaulted to 8.0.",
          package: "Extracted package range 10-12 LPA from content matches.",
          headcount: "Extracted 8 openings.",
          eligible_branches: "Branches defaulting to CSE, ISE."
        });
        setLoading(false);
        setShowCreateModal(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, jd_raw_text: jdText })
      });
      const data = await response.json();
      
      setDraftDrive(data.drive);
      setParsedExplanations(data.explanations);
      setConfirmForm({
        company_name: data.drive.company_name,
        role_title: data.drive.role_title,
        cgpa_cutoff: data.drive.cgpa_cutoff,
        eligible_branches: data.drive.eligible_branches,
        package_min: data.drive.package_min,
        package_max: data.drive.package_max,
        headcount: data.drive.headcount,
        required_skills: data.drive.required_skills
      });
      
      setLoading(false);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to parse JD. See console.");
      setLoading(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!draftDrive) return;
    setLoading(true);

    if (!isOnline) {
      setTimeout(() => {
        alert("[Mock Mode] Drive published and eligibility check complete!");
        setLoading(false);
        setDraftDrive(null);
        onRefreshDrives();
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/drives/${draftDrive.id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmForm)
      });
      const data = await response.json();
      alert("Drive Published! Eligibility filters triggered.");
      setDraftDrive(null);
      setLoading(false);
      onSelectDrive(data.drive.id);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to publish drive.");
      setLoading(false);
    }
  };

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="AI Intake Agent"
        title="Recruitment Drives Dashboard"
        description="Configure drives from recruiter PDFs or raw JDs, extract fields, and trigger eligibility rules."
        action={
          <Button onClick={() => {
            setCompanyName('');
            setJdText('');
            setDraftDrive(null);
            setShowCreateModal(true);
          }}><Plus size={15}/> New Drive (Parse JD)</Button>
        }
      />

      {/* Draft JD Intake Panel */}
      {draftDrive && (
        <section className="panel mb-6 border-amber-600 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="panel-head">
            <div>
              <h2 className="text-amber-800 dark:text-amber-400">Review Parsed JD (Human Verification Required)</h2>
              <p>Modify extracted attributes before executing academic eligibility audits.</p>
            </div>
            <StatusBadge tone="warn">DRAFT REVIEW</StatusBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Company Name</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" value={confirmForm.company_name} onChange={e => setConfirmForm({...confirmForm, company_name: e.target.value})} />
              {parsedExplanations?.company_name && <span className="text-[10px] text-primary">{parsedExplanations.company_name}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Role Title</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" value={confirmForm.role_title} onChange={e => setConfirmForm({...confirmForm, role_title: e.target.value})} />
              {parsedExplanations?.role_title && <span className="text-[10px] text-primary">{parsedExplanations.role_title}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">CGPA Cutoff</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" type="number" step="0.1" value={confirmForm.cgpa_cutoff} onChange={e => setConfirmForm({...confirmForm, cgpa_cutoff: parseFloat(e.target.value) || 0})} />
              {parsedExplanations?.cgpa_cutoff && <span className="text-[10px] text-primary">{parsedExplanations.cgpa_cutoff}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Min Package (LPA)</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" type="number" step="0.5" value={confirmForm.package_min} onChange={e => setConfirmForm({...confirmForm, package_min: parseFloat(e.target.value) || 0})} />
              {parsedExplanations?.package && <span className="text-[10px] text-primary">{parsedExplanations.package}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Max Package (LPA)</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" type="number" step="0.5" value={confirmForm.package_max} onChange={e => setConfirmForm({...confirmForm, package_max: parseFloat(e.target.value) || 0})} />
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Target Headcount</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" type="number" value={confirmForm.headcount} onChange={e => setConfirmForm({...confirmForm, headcount: parseInt(e.target.value) || 0})} />
              {parsedExplanations?.headcount && <span className="text-[10px] text-primary">{parsedExplanations.headcount}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border col-span-1 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Eligible Branches (Comma Separated)</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" value={confirmForm.eligible_branches.join(', ')} onChange={e => setConfirmForm({...confirmForm, eligible_branches: e.target.value.split(',').map(x => x.trim())})} />
              {parsedExplanations?.eligible_branches && <span className="text-[10px] text-primary">{parsedExplanations.eligible_branches}</span>}
            </div>

            <div className="flex flex-col gap-1 bg-background p-3 rounded-lg border border-border col-span-1 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Required Skills (Comma Separated)</label>
              <input className="font-semibold bg-transparent border-b border-border/80 outline-none text-foreground text-xs py-1" value={confirmForm.required_skills.required.join(', ')} onChange={e => setConfirmForm({...confirmForm, required_skills: { ...confirmForm.required_skills, required: e.target.value.split(',').map(x => x.trim()) }})} />
              {parsedExplanations?.required_skills && <span className="text-[10px] text-primary">{parsedExplanations.required_skills}</span>}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDraftDrive(null)}>Cancel Draft</Button>
            <Button variant="primary" disabled={loading} onClick={handleConfirmPublish}>
              {loading ? 'Confirming...' : 'Confirm & Publish'} <ArrowRight size={15}/>
            </Button>
          </div>
        </section>
      )}

      {/* Active Drives List */}
      <div className="grid grid-cols-1 gap-6">
        <section className="panel shadow-sm">
          <div className="panel-head">
            <h2>All Recruitment Pipelines</h2>
            <p>Select a drive to apply operations or view shortlist candidates.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                  <th className="p-3">Company</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Cutoff</th>
                  <th className="p-3">Salary Range</th>
                  <th className="p-3">Headcount</th>
                  <th className="p-3">Pipeline Stage</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((d) => (
                  <tr key={d.id} className={`border-b border-border hover:bg-muted/10 cursor-pointer transition-colors ${activeDriveId === d.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`} onClick={() => onSelectDrive(d.id)}>
                    <td className="p-3 font-semibold text-foreground">{d.company_name}</td>
                    <td className="p-3 text-muted-foreground">{d.role_title}</td>
                    <td className="p-3 font-mono">{d.cgpa_cutoff} CGPA</td>
                    <td className="p-3 font-mono">{d.package_min} - {d.package_max} LPA</td>
                    <td className="p-3">{d.headcount} slots</td>
                    <td className="p-3">
                      <StatusBadge tone={d.stage === 'completed' ? 'neutral' : d.stage === 'matching' ? 'warn' : 'good'}>
                        {d.stage.toUpperCase()}
                      </StatusBadge>
                    </td>
                    <td className="p-3">
                      <button className="row-action font-semibold text-primary font-bold hover:underline" onClick={(e) => { e.stopPropagation(); onSelectDrive(d.id); alert(`Selected target drive: ${d.company_name}`); }}>Focus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* CREATE NEW DRIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form className="bg-card w-full max-w-xl rounded-xl border border-border p-6 shadow-2xl relative motion-page" onSubmit={handleStartIntake}>
            <button type="button" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setShowCreateModal(false)}>
              <X size={18} />
            </button>
            <h2 className="mb-2">Start Recruitment Drive Intake</h2>
            <p className="text-xs text-muted-foreground mb-4">Paste the job description text below. The JD Intake agent will isolate requirements, cutoff rules, and packages.</p>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Company Name</label>
                <input required className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" placeholder="e.g. Google India" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Raw Job Description Text</label>
                <textarea required rows={8} className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-mono" placeholder="Paste full JD text here (including packages, cutoff, and skills required)..." value={jdText} onChange={e => setJdText(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Run Extraction Agent'} <ArrowRight size={14}/>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EligibilityScreen({ isOnline, activeDrive, drives, onSelectDrive }: { isOnline: boolean; activeDrive: any | null; drives: any[]; onSelectDrive: (id: number) => void }) {
  const [eligibilityList, setEligibilityList] = useState<any[]>([]);
  const [overrideModal, setOverrideModal] = useState<{ show: boolean; record: any } | null>(null);
  const [overrideEligible, setOverrideEligible] = useState(true);
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDrive) return;

    if (!isOnline) {
      setEligibilityList([
        { eligibility_id: 1, student_id: 101, student_name: "Aditya Sharma", branch: "CSE", cgpa: 9.2, backlog_count: 0, current_best_offer: null, eligible: true, reason: "Meets all criteria", overridden_by_tpo: false, flagged_for_review: false },
        { eligibility_id: 2, student_id: 102, student_name: "Rohan Verma", branch: "CSE", cgpa: 7.9, backlog_count: 0, current_best_offer: null, eligible: false, reason: "CGPA 7.9 is within 0.2 of cutoff 8.0", overridden_by_tpo: false, flagged_for_review: true },
        { eligibility_id: 3, student_id: 103, student_name: "Sneha Patil", branch: "ISE", cgpa: 8.5, backlog_count: 0, current_best_offer: null, eligible: true, reason: "Meets all criteria", overridden_by_tpo: false, flagged_for_review: false },
        { eligibility_id: 4, student_id: 104, student_name: "Vikram Rathore", branch: "ECE", cgpa: 8.1, backlog_count: 1, current_best_offer: null, eligible: false, reason: "Student has 1 active backlogs", overridden_by_tpo: false, flagged_for_review: false }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/drives/${activeDrive.id}/eligibility`)
      .then(res => res.json())
      .then(data => setEligibilityList(data))
      .catch(err => console.error(err));
  }, [activeDrive, isOnline, loading]);

  const stats = useMemo(() => {
    const total = eligibilityList.length;
    const eligible = eligibilityList.filter(x => x.eligible).length;
    const flagged = eligibilityList.filter(x => x.flagged_for_review && !x.overridden_by_tpo).length;
    const excluded = total - eligible - flagged;
    return { total, eligible, flagged, excluded };
  }, [eligibilityList]);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;
    setLoading(true);

    if (!isOnline) {
      setTimeout(() => {
        setEligibilityList(prev => prev.map(item => {
          if (item.eligibility_id === overrideModal.record.eligibility_id) {
            return {
              ...item,
              eligible: overrideEligible,
              overridden_by_tpo: true,
              reason: `[TPO Override] ${overrideReason} (Originally: ${item.reason})`
            };
          }
          return item;
        }));
        setLoading(false);
        setOverrideModal(null);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/eligibility/${overrideModal.record.eligibility_id}/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eligible: overrideEligible, reason: overrideReason })
      });
      await response.json();
      setLoading(false);
      setOverrideModal(null);
    } catch (err) {
      console.error(err);
      alert("Failed override");
      setLoading(false);
    }
  };

  if (!activeDrive) {
    return <div className="p-4 text-center">Please select/create a drive to run the eligibility engine.</div>;
  }

  return (
    <div className="motion-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="eyebrow">Academic Eligibility Engine</div>
          <h1>{activeDrive.company_name} · Eligibility Results</h1>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground mr-2">Target Drive:</label>
          <select className="bg-card border border-border text-foreground text-xs p-2 rounded-lg" value={activeDrive.id} onChange={e => onSelectDrive(parseInt(e.target.value))}>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="summary-bar">
        <div>
          <strong>{stats.eligible}</strong>
          <span>Eligible Candidates</span>
        </div>
        <div>
          <strong>{stats.flagged}</strong>
          <span>Flagged for Review</span>
        </div>
        <div>
          <strong>{stats.excluded}</strong>
          <span>Excluded</span>
        </div>
        <div className="summary-why">
          <Why>Audits branches, CGPA thresholds ({activeDrive.cgpa_cutoff}), backlogs, and package ceilings.</Why>
        </div>
      </div>

      {/* Eligibility Table */}
      <section className="panel shadow-sm">
        <div className="panel-head">
          <h2>Academic Audit Trail</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                <th className="p-3">Candidate</th>
                <th className="p-3 font-mono">Branch/CGPA</th>
                <th className="p-3">Audited Status</th>
                <th className="p-3">Explanation / Reason</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {eligibilityList.map((rec) => (
                <tr key={rec.eligibility_id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold">{rec.student_name}</td>
                  <td className="p-3 font-mono">{rec.branch} · {rec.cgpa}</td>
                  <td className="p-3">
                    <StatusBadge tone={rec.overridden_by_tpo ? 'good' : (rec.eligible ? 'good' : (rec.flagged_for_review ? 'warn' : 'neutral'))}>
                      {rec.overridden_by_tpo ? 'OVERRIDDEN' : (rec.eligible ? 'ELIGIBLE' : (rec.flagged_for_review ? 'FLAGGED' : 'EXCLUDED'))}
                    </StatusBadge>
                  </td>
                  <td className="p-3 text-muted-foreground">{rec.reason}</td>
                  <td className="p-3">
                    {rec.flagged_for_review || rec.overridden_by_tpo ? (
                      <button className="row-action font-semibold text-primary font-bold hover:underline" onClick={() => {
                        setOverrideEligible(rec.eligible);
                        setOverrideReason('');
                        setOverrideModal({ show: true, record: rec });
                      }}>
                        Override
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OVERRIDE MODAL */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl relative motion-page" onSubmit={handleOverrideSubmit}>
            <button type="button" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setOverrideModal(null)}>
              <X size={18} />
            </button>
            <h2 className="mb-2">Manual TPO Eligibility Override</h2>
            <p className="text-xs text-muted-foreground mb-4">Override eligibility for candidate: {overrideModal.record.student_name}.</p>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Set Eligibility Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-semibold">
                    <input type="radio" checked={overrideEligible === true} onChange={() => setOverrideEligible(true)} />
                    Force Eligible
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-semibold">
                    <input type="radio" checked={overrideEligible === false} onChange={() => setOverrideEligible(false)} />
                    Force Exclude
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Override Reason (Audited)</label>
                <input required className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" placeholder="Reason..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setOverrideModal(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Apply & Audit Override'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MatchingScreen({ isOnline, activeDrive, drives, onSelectDrive }: { isOnline: boolean; activeDrive: any | null; drives: any[]; onSelectDrive: (id: number) => void }) {
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDrive) return;

    if (!isOnline) {
      setShortlist([
        { match_id: 1, student_id: 101, student_name: "Aditya Sharma", branch: "CSE", cgpa: 9.2, overall_score: 91, skill_score: 95, academic_score: 84, project_score: 90, readiness_score: 88, approved: false, feature_importance: { "JD Skill Alignment": 18.2, "Academic Score (API)": 12.4, "Projects Count": 5.1, "Readiness Score (PRS)": 8.5 } },
        { match_id: 2, student_id: 103, student_name: "Sneha Patil", branch: "ISE", cgpa: 8.5, overall_score: 88, skill_score: 80, academic_score: 89, project_score: 75, readiness_score: 92, approved: false, feature_importance: { "JD Skill Alignment": 14.5, "Academic Score (API)": 15.2, "Projects Count": 4.2, "Readiness Score (PRS)": 9.1 } }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/drives/${activeDrive.id}/shortlist`)
      .then(res => res.json())
      .then(data => {
        setShortlist(data);
        const preApproved = data.filter((x: any) => x.approved).map((x: any) => x.student_id);
        setSelectedStudentIds(preApproved);
      })
      .catch(err => console.error(err));
  }, [activeDrive, isOnline]);

  const toggleSelectStudent = (sid: number) => {
    if (selectedStudentIds.includes(sid)) {
      setSelectedStudentIds(prev => prev.filter(id => id !== sid));
    } else {
      setSelectedStudentIds(prev => [...prev, sid]);
    }
  };

  const handleApproveShortlist = async () => {
    if (!activeDrive) return;
    setLoading(true);

    if (!isOnline) {
      setTimeout(() => {
        alert("[Mock Mode] Shortlist approved!");
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/drives/${activeDrive.id}/shortlist/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_candidate_ids: selectedStudentIds })
      });
      const data = await response.json();
      alert(data.message);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed shortlist approval.");
      setLoading(false);
    }
  };

  if (!activeDrive) {
    return <div className="p-4 text-center">Please select a drive.</div>;
  }

  return (
    <div className="motion-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="eyebrow">Compatibility Scoring & SHAP Explainer</div>
          <h1>{activeDrive.company_name} · Recruiter Shortlist</h1>
        </div>
        <div className="flex gap-2">
          <select className="bg-card border border-border text-foreground text-xs p-2 rounded-lg" value={activeDrive.id} onChange={e => onSelectDrive(parseInt(e.target.value))}>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
          <Button variant="primary" disabled={loading || selectedStudentIds.length === 0} onClick={handleApproveShortlist}>
            {loading ? 'Approving...' : `Lock & Shortlist ${selectedStudentIds.length} Candidates`} <Send size={14} />
          </Button>
        </div>
      </div>

      <section className="panel shadow-sm">
        <div className="panel-head">
          <h2>Ranked Candidates (Weighted Matching Multi-Agent Score)</h2>
        </div>

        <div className="candidate-list">
          {shortlist.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs font-semibold">No eligible candidates qualified.</div>
          ) : (
            shortlist.map((c, index) => {
              const isExpanded = expandedIndex === index;
              const isSelected = selectedStudentIds.includes(c.student_id);
              
              return (
                <div className="candidate-card border-b border-border pb-4 last:border-b-0" key={c.student_id}>
                  <div className="candidate-main flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer text-primary border-border accent-primary" checked={isSelected} onChange={() => toggleSelectStudent(c.student_id)} />
                      <span className="rank font-mono text-sm">#{c.rank}</span>
                      <span className="avatar teal-bg text-xs shrink-0">{c.student_name.slice(0,2).toUpperCase()}</span>
                      <div>
                        <strong className="text-sm block">{c.student_name}</strong>
                        <span className="text-xs text-muted-foreground">{c.branch} · {c.cgpa} CGPA</span>
                      </div>
                    </div>

                    <div className="candidate-score mr-4">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-display text-xl font-bold">{c.overall_score}%</strong>
                      <span className="text-[10px] font-mono text-muted-foreground block text-right">compatibility</span>
                    </div>

                    <button className="expand-button font-bold text-primary text-xs flex items-center gap-1" onClick={() => setExpandedIndex(isExpanded ? null : index)}>
                      {isExpanded ? 'Hide Details' : 'Explain Why'} <ChevronDown size={14} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="score-breakdown mt-4 ml-8 bg-muted/30 p-4 rounded-xl border border-border motion-page shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 font-mono">Weighted Components</h4>
                          <div className="score-bars space-y-3">
                            {[
                              ['Skills overlap (40%)', c.skill_score],
                              ['Academic fit (25%)', c.academic_score],
                              ['Project relevance (20%)', c.project_score],
                              ['Readiness index (15%)', c.readiness_score]
                            ].map(([label, val]) => (
                              <div key={label as string} className="flex justify-between items-center text-xs gap-3 font-semibold">
                                <span className="w-32">{label}</span>
                                <div className="bar flex-1 h-2 bg-border rounded-full overflow-hidden">
                                  <i className="block h-full bg-primary" style={{ width: `${val}%` }} />
                                </div>
                                <strong className="w-8 text-right font-mono">{val}%</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 font-mono flex items-center gap-1">
                            <Sparkles size={13} className="text-primary" /> SHAP Feature Impact
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(c.feature_importance || {}).map(([key, val]: [string, any]) => (
                              <div key={key} className="flex justify-between items-center text-xs font-semibold">
                                <span>{key}</span>
                                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">+{val}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SchedulingScreen({ isOnline, activeDrive, drives, onSelectDrive }: { isOnline: boolean; activeDrive: any | null; drives: any[]; onSelectDrive: (id: number) => void }) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [panels, setPanels] = useState('Dr. Prasad, Mr. Amit');
  const [rooms, setRooms] = useState('Room 101, Room 102');
  const [slots, setSlots] = useState(
    '2026-08-22 10:00 - 10:30\n2026-08-22 10:30 - 11:00\n2026-08-22 11:00 - 11:30'
  );

  const [editModal, setEditModal] = useState<{ show: boolean; record: any } | null>(null);
  const [editSlot, setEditSlot] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editPanels, setEditPanels] = useState('');

  useEffect(() => {
    if (!activeDrive) return;

    if (!isOnline) {
      setInterviews([
        { interview_id: 1, student_id: 101, student_name: "Aditya Sharma", panel_members: ["Dr. Prasad"], room_or_link: "Room 101", time_slot: "2026-08-22 10:00 - 10:30", status: "scheduled", conflict_flag: false },
        { interview_id: 2, student_id: 103, student_name: "Sneha Patil", panel_members: ["Mr. Amit"], room_or_link: "Room 102", time_slot: "2026-08-22 10:00 - 10:30", status: "scheduled", conflict_flag: true }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/drives/${activeDrive.id}/interviews`)
      .then(res => res.json())
      .then(data => setInterviews(data))
      .catch(err => console.error(err));
  }, [activeDrive, isOnline, loading]);

  const handlePropose = async () => {
    if (!activeDrive) return;
    setLoading(true);

    const payload = {
      panel_members: panels.split(',').map(x => x.trim()),
      rooms: rooms.split(',').map(x => x.trim()),
      available_slots: slots.split('\n').map(x => x.trim()).filter(Boolean)
    };

    if (!isOnline) {
      setTimeout(() => {
        alert("Proposals generated.");
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/drives/${activeDrive.id}/schedule/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setInterviews(data);
      setLoading(false);
      alert("Proposals generated. Coordination check complete.");
    } catch (err) {
      console.error(err);
      alert("Scheduling error");
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeDrive) return;
    setLoading(true);

    if (!isOnline) {
      setTimeout(() => {
        alert("Schedule confirmed. Notifications dispatched!");
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/schedule/${activeDrive.id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tpo_name: "TPO" })
      });
      const data = await response.json();
      alert(data.message);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Confirmation failed");
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setLoading(true);

    const payload = {
      time_slot: editSlot,
      room_or_link: editRoom,
      panel_members: editPanels.split(',').map(x => x.trim()),
      tpo_name: "TPO"
    };

    if (!isOnline) {
      setTimeout(() => {
        setInterviews(prev => prev.map(item => {
          if (item.interview_id === editModal.record.interview_id) {
            return {
              ...item,
              time_slot: editSlot,
              room_or_link: editRoom,
              panel_members: payload.panel_members,
              conflict_flag: false
            };
          }
          return item;
        }));
        setLoading(false);
        setEditModal(null);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/interviews/${editModal.record.interview_id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await response.json();
      setLoading(false);
      setEditModal(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Resolution edit failed");
      setLoading(false);
    }
  };

  if (!activeDrive) {
    return <div className="p-4 text-center">Please select a drive.</div>;
  }

  const conflictsCount = interviews.filter(i => i.conflict_flag).length;

  return (
    <div className="motion-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="eyebrow">Interview Scheduling & Coordination</div>
          <h1>{activeDrive.company_name} · Slot Manager</h1>
        </div>
        <div className="flex gap-2">
          <select className="bg-card border border-border text-foreground text-xs p-2 rounded-lg" value={activeDrive.id} onChange={e => onSelectDrive(parseInt(e.target.value))}>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
          <Button variant="primary" disabled={loading} onClick={handleConfirm}>
            Lock & Dispatch Notifications
          </Button>
        </div>
      </div>

      <div className="schedule-grid">
        <section className="panel shadow-sm">
          <div className="panel-head">
            <h2>Generate Proposed Schedule</h2>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Panels (Comma Separated)</label>
              <input className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" value={panels} onChange={e => setPanels(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Rooms/Links</label>
              <input className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" value={rooms} onChange={e => setRooms(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Available Slots (One per line)</label>
              <textarea rows={4} className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-mono" value={slots} onChange={e => setSlots(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" className="w-full justify-center" disabled={loading} onClick={handlePropose}>
            Run Scheduling Agent
          </Button>
        </section>

        <section className="panel shadow-sm">
          <div className="panel-head">
            <h2>Coordination Safety Warnings</h2>
            <StatusBadge tone={conflictsCount > 0 ? 'danger' : 'good'}>
              {conflictsCount} conflicts
            </StatusBadge>
          </div>
          <div className="space-y-3">
            {interviews.filter(i => i.conflict_flag).map((item) => (
              <div key={item.interview_id} className="conflict-card shadow-sm">
                <div className="conflict-head">
                  <span className="action-icon coral"><AlertTriangle size={15}/></span>
                  <div>
                    <strong>Double Booking: {item.student_name}</strong>
                    <span className="mono text-[10px] text-muted-foreground">{item.time_slot}</span>
                  </div>
                </div>
                <Button variant="coral" className="w-full mt-2 justify-center" onClick={() => {
                  setEditSlot(item.time_slot);
                  setEditRoom(item.room_or_link);
                  setEditPanels(item.panel_members.join(', '));
                  setEditModal({ show: true, record: item });
                }}>
                  Resolve Conflict
                </Button>
              </div>
            ))}
            {conflictsCount === 0 && <div className="p-6 text-center text-muted-foreground text-xs font-semibold">No conflicts detected.</div>}
          </div>
        </section>
      </div>

      {/* Slots List */}
      <section className="panel mt-6 shadow-sm">
        <div className="panel-head">
          <h2>Proposed Interview Assignments</h2>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                <th className="p-3">Candidate</th>
                <th className="p-3">Time Slot</th>
                <th className="p-3">Location / Room</th>
                <th className="p-3">Panelists</th>
                <th className="p-3">Conflict</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((intr) => (
                <tr key={intr.interview_id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold">{intr.student_name}</td>
                  <td className="p-3 font-mono">{intr.time_slot}</td>
                  <td className="p-3">{intr.room_or_link}</td>
                  <td className="p-3">{intr.panel_members.join(', ')}</td>
                  <td className="p-3">
                    <StatusBadge tone={intr.conflict_flag ? 'danger' : 'good'}>
                      {intr.conflict_flag ? 'CLASH' : 'RESOLVED'}
                    </StatusBadge>
                  </td>
                  <td className="p-3">
                    <button className="row-action text-primary font-bold hover:underline" onClick={() => {
                      setEditSlot(intr.time_slot);
                      setEditRoom(intr.room_or_link);
                      setEditPanels(intr.panel_members.join(', '));
                      setEditModal({ show: true, record: intr });
                    }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl relative motion-page" onSubmit={handleEditSubmit}>
            <button type="button" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setEditModal(null)}>
              <X size={18} />
            </button>
            <h2 className="mb-2">Resolve Interview Allocation</h2>
            <p className="text-xs text-muted-foreground mb-4">Adjusting details for student: {editModal.record.student_name}</p>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Time Slot</label>
                <input required className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-mono font-semibold" value={editSlot} onChange={e => setEditSlot(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Room / Link</label>
                <input required className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" value={editRoom} onChange={e => setEditRoom(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Panel Members (Comma Separated)</label>
                <input required className="w-full bg-input border border-border rounded-lg p-2 text-foreground text-xs font-semibold" value={editPanels} onChange={e => setEditPanels(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading}>
                Update and Re-Validate
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ExceptionsScreen({ isOnline, onUpdateException }: { isOnline: boolean; onUpdateException: () => void }) {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setExceptions([
        { exception_id: 1, company_name: "TechCorp", type: "eligibility_edge_case", severity: "medium", description: "Student Rohan Verma has CGPA 7.9. Cutoff is 8.0. Borderline.", resolved: false },
        { exception_id: 2, company_name: "Acme Systems", type: "missing_data", severity: "low", description: "Student Sneha Patil is missing semester 5 marks. Computed readiness score with available marks.", resolved: false }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/exceptions`)
      .then(res => res.json())
      .then(data => setExceptions(data))
      .catch(err => console.error(err));
  }, [isOnline, loading]);

  const handleResolve = async (id: number) => {
    setLoading(true);
    if (!isOnline) {
      setTimeout(() => {
        setExceptions(prev => prev.filter(x => x.exception_id !== id));
        setLoading(false);
        onUpdateException();
      }, 300);
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/exceptions/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: "TPO" })
      });
      setLoading(false);
      onUpdateException();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const activeExc = exceptions.filter(x => !x.resolved);

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Operations Queue"
        title="Exceptions Center"
        description="Resolve borderline filters, resource allocation overlaps, and system configuration anomalies."
      />

      <div className="exception-summary mb-4">
        <span><strong>{activeExc.length}</strong> open exceptions</span>
        <span><i className="severity-dot coral-bg"/> {activeExc.filter(x => x.severity === 'high').length} high</span>
        <span><i className="severity-dot orange-bg"/> {activeExc.filter(x => x.severity === 'medium').length} medium</span>
      </div>

      <section className="panel exception-panel shadow-sm">
        <div className="table-head exception-head">
          <span>Drive</span>
          <span>Anomaly Details</span>
          <span>Severity</span>
          <span>Type Category</span>
          <span>Actions</span>
        </div>

        {activeExc.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs font-semibold">All clear! No pending exceptions.</div>
        ) : (
          activeExc.map((exc) => {
            let tone = 'neutral';
            if (exc.severity === 'high') tone = 'danger';
            else if (exc.severity === 'medium') tone = 'warn';

            return (
              <div className="exception-row" key={exc.exception_id}>
                <strong className="text-primary">{exc.company_name}</strong>
                <span>{exc.description}</span>
                <StatusBadge tone={tone as any}>{exc.severity.toUpperCase()}</StatusBadge>
                <span className="mono">{exc.type}</span>
                <div className="button-group">
                  <Button variant={exc.severity === 'high' ? 'coral' : 'outline'} onClick={() => handleResolve(exc.exception_id)}>
                    Resolve
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function AnalyticsScreen({ isOnline }: { isOnline: boolean }) {
  const [skillGap, setSkillGap] = useState<any[]>([]);
  const [trends, setTrends] = useState<any | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setSkillGap([
        { skill: "Python", demand: 4, supply: 6, gap: 0 },
        { skill: "SQL", demand: 3, supply: 7, gap: 0 },
        { skill: "React", demand: 2, supply: 3, gap: 0 },
        { skill: "AWS", demand: 2, supply: 1, gap: 1 },
        { skill: "Tableau", demand: 1, supply: 0, gap: 1 }
      ]);
      setTrends({
        department_comparison: [
          { branch: "CSE", avg_cgpa: 8.56, avg_api: 86.2, avg_ssi: 74.5, avg_prs: 81.2, student_count: 4 },
          { branch: "ECE", avg_cgpa: 7.94, avg_api: 78.4, avg_ssi: 54.1, avg_prs: 62.0, student_count: 2 },
          { branch: "ME", avg_cgpa: 8.12, avg_api: 81.2, avg_ssi: 30.0, avg_prs: 45.0, student_count: 1 }
        ],
        overall_averages: { avg_api: 81.93, avg_ssi: 53.07, avg_prs: 63.43 }
      });
      return;
    }

    fetch(`${BACKEND_URL}/analytics/skill-gap`)
      .then(res => res.json())
      .then(data => setSkillGap(data))
      .catch(err => console.error(err));

    fetch(`${BACKEND_URL}/analytics/readiness-trend`)
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(err => console.error(err));
  }, [isOnline]);

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Placement Intelligence"
        title="Curriculum Skill Gaps & Readiness Analytics"
        description="Visualize student compatibility vs. employer demand vectors dynamically."
      />

      <div className="chart-grid">
        <section className="panel chart-panel shadow-sm">
          <div className="panel-head">
            <h2>Skill Gap Vector Analysis</h2>
          </div>
          <div className="bars">
            {skillGap.map((item) => {
              const maxDemand = Math.max(...skillGap.map(x => x.demand), 1);
              const maxSupply = Math.max(...skillGap.map(x => x.supply), 1);
              const maxVal = Math.max(maxDemand, maxSupply);

              const demandWidth = (item.demand / maxVal) * 100;
              const supplyWidth = (item.supply / maxVal) * 100;

              return (
                <div className="bar-row text-xs font-semibold" key={item.skill}>
                  <span className="font-semibold">{item.skill}</span>
                  <div className="double-bar">
                    <i style={{ width: `${demandWidth}%` }} />
                    <b style={{ width: `${supplyWidth}%` }} />
                  </div>
                  <span className="mono text-muted-foreground text-right">{item.gap > 0 ? `Gap: ${item.gap}` : 'No Gap'}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span><i className="legend-demand" /> Active Employer Demand</span>
            <span><i className="legend-skill" /> Student Proficiency</span>
          </div>
        </section>

        <section className="panel chart-panel shadow-sm">
          <div className="panel-head">
            <h2>Placement Readiness Indexes</h2>
          </div>
          {trends && (
            <div className="flex flex-col justify-center h-full gap-4 py-6">
              <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg">
                <span className="font-semibold text-xs uppercase font-mono">Academic Score (API)</span>
                <strong className="text-xl text-primary font-display font-bold">{trends.overall_averages.avg_api}%</strong>
              </div>
              <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg">
                <span className="font-semibold text-xs uppercase font-mono">Skill Strength (SSI)</span>
                <strong className="text-xl text-amber-600 font-display font-bold">{trends.overall_averages.avg_ssi}%</strong>
              </div>
              <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg">
                <span className="font-semibold text-xs uppercase font-mono">Readiness Index (PRS)</span>
                <strong className="text-xl text-indigo-600 font-display font-bold">{trends.overall_averages.avg_prs}%</strong>
              </div>
            </div>
          )}
        </section>
      </div>

      {trends && (
        <section className="panel mt-6 shadow-sm">
          <div className="panel-head">
            <h2>Placement Readiness by Department (Branch)</h2>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase text-muted-foreground">
                  <th className="p-3">Branch</th>
                  <th className="p-3">Students</th>
                  <th className="p-3">Avg CGPA</th>
                  <th className="p-3">Avg Academic (API)</th>
                  <th className="p-3">Avg Skill Strength (SSI)</th>
                  <th className="p-3">Avg Placement Readiness (PRS)</th>
                </tr>
              </thead>
              <tbody>
                {trends.department_comparison.map((dep: any) => (
                  <tr key={dep.branch} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{dep.branch}</td>
                    <td className="p-3">{dep.student_count}</td>
                    <td className="p-3 font-mono">{dep.avg_cgpa}</td>
                    <td className="p-3 font-mono text-primary font-bold">{dep.avg_api}%</td>
                    <td className="p-3 font-mono text-amber-600 font-bold">{dep.avg_ssi}%</td>
                    <td className="p-3 font-mono text-indigo-600 font-bold">{dep.avg_prs}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function NotificationsScreen({ isOnline }: { isOnline: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isOnline) {
      setNotifications([
        { notification_id: 1, recipient_name: "Aditya Sharma", recipient_type: "student", channel: "email", message_template: "Dear Aditya,\n\nYour interview for Acme Systems has been scheduled! Time: 2026-08-22 10:00 - 10:30. Room: Room 101.", sent_at: "2026-08-21T06:20:00Z", delivery_status: "delivered" }
      ]);
      return;
    }

    fetch(`${BACKEND_URL}/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  }, [isOnline]);

  return (
    <div className="motion-page">
      <SectionTitle
        eyebrow="Agent Output logs"
        title="Sent Notifications & SMS Feed"
        description="Verify portal dispatches and email deliveries to candidates and panels."
      />

      <section className="panel shadow-sm">
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.notification_id} className="p-4 bg-muted/20 border border-border rounded-xl flex gap-3">
              <span className="action-icon good"><Mail size={16}/></span>
              <div className="flex-1 min-width-0">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <strong className="text-xs block text-foreground">To: {n.recipient_name} ({n.recipient_type})</strong>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(n.sent_at).toLocaleString()}</span>
                  </div>
                  <StatusBadge tone="good">{n.delivery_status.toUpperCase()}</StatusBadge>
                </div>
                <pre className="mt-2 text-xs bg-background p-3 rounded-lg border border-border/80 text-muted-foreground whitespace-pre-wrap font-sans">
                  {n.message_template}
                </pre>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <div className="p-6 text-center text-muted-foreground text-xs font-semibold">No notifications.</div>}
        </div>
      </section>
    </div>
  );
}

function ReportsScreen({ isOnline, drives }: { isOnline: boolean; drives: any[] }) {
  const [selectedReportDriveId, setSelectedReportDriveId] = useState<number | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (drives.length > 0 && selectedReportDriveId === null) {
      setSelectedReportDriveId(drives[0].id);
    }
  }, [drives]);

  useEffect(() => {
    if (selectedReportDriveId === null) return;
    setLoading(true);

    if (!isOnline) {
      setReport({
        company_name: "Mock Company Ltd",
        role_title: "Product Engineer",
        package_range: "8.0 - 10.0 LPA",
        date: "2026-08-21",
        stats: {
          eligible_students: 8,
          shortlisted_students: 4,
          total_interviews: 4,
          completed_interviews: 3,
          no_shows: 1,
          cancelled: 0,
          offers_made: 2,
          conversion_rate_pct: 25.0,
          no_show_rate_pct: 25.0
        }
      });
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/reports/${selectedReportDriveId}`)
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedReportDriveId, isOnline]);

  const csvDownloadUrl = selectedReportDriveId ? `${BACKEND_URL}/reports/${selectedReportDriveId}/csv` : '#';

  return (
    <div className="motion-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="eyebrow">Audit Trial & Post-Drive Summaries</div>
          <h1>Post-Drive Reporting & Compliance</h1>
        </div>
        <div className="flex gap-2">
          <select className="bg-card border border-border text-foreground text-xs p-2 rounded-lg" value={selectedReportDriveId || ''} onChange={e => setSelectedReportDriveId(parseInt(e.target.value))}>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
          {selectedReportDriveId && (
            <a href={csvDownloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-xs flex items-center gap-1 font-semibold">
              <FileSpreadsheet size={14} /> Download CSV Report
            </a>
          )}
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="panel md:col-span-2 shadow-sm">
            <div className="panel-head">
              <h2>{report.company_name} · {report.role_title}</h2>
              <p>Date Compiled: {report.date} · Package: {report.package_range}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Qualified</span>
                <strong className="text-2xl font-display text-primary block mt-1 font-bold">{report.stats.eligible_students}</strong>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Shortlisted</span>
                <strong className="text-2xl font-display text-primary block mt-1 font-bold">{report.stats.shortlisted_students}</strong>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Offers</span>
                <strong className="text-2xl font-display text-emerald-600 block mt-1 font-bold">{report.stats.offers_made}</strong>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Turnout</span>
                <strong className="text-2xl font-display text-foreground block mt-1 font-bold">{report.stats.completed_interviews}</strong>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">No-Show Rate</span>
                <strong className="text-2xl font-display text-red-500 block mt-1 font-bold">{report.stats.no_show_rate_pct}%</strong>
              </div>
              <div className="p-4 bg-muted/40 rounded-xl">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Conversion</span>
                <strong className="text-2xl font-display text-primary block mt-1 font-bold">{report.stats.conversion_rate_pct}%</strong>
              </div>
            </div>
          </section>

          <section className="panel shadow-sm">
            <div className="panel-head">
              <h2>Reporting Audit Playbook</h2>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <p>Post-drive reports compile candidate funnels, interview turnout metrics, and final selections.</p>
              <p className="font-semibold text-foreground">Compliance Rules:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Every override is recorded in the AuditLog database.</li>
                <li>Candidate rankings are static after recruiter locks.</li>
              </ul>
              <Why>Compliance and audit logs are built into the reporting agent workflow.</Why>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const agents = [
  ['01', 'JD intake', 'Turn recruiter briefs into structured requirements.', FileText],
  ['02', 'Eligibility', 'Apply rules across branches, CGPA and backlogs.', ClipboardCheck],
  ['03', 'Matching', 'Rank candidates with transparent SHAP explanations.', Target],
  ['04', 'Scheduling', 'Propose interview slots around real constraints.', CalendarDays],
  ['05', 'Coordination', 'Keep panels, rooms and candidates in sync.', Building2],
  ['06', 'Notification', 'Send updates to the right student cohort.', Bell],
  ['07', 'Analytics', 'See skill gaps and placement readiness.', BarChart3],
  ['08', 'Reporting', 'Export a clean audit trail for every drive.', FileText],
  ['09', 'Exception', 'Surface ambiguity before it becomes a blocker.', AlertTriangle],
]
