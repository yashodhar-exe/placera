import React, { useState } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertTriangle
} from 'lucide-react';

export default function AuthView({ 
  initialMode = 'login', 
  onAuthenticate, 
  onBackToLanding 
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('tpo'); // 'student' | 'tpo' | 'recruiter'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const getSupportingText = () => {
    if (mode === 'signup') {
      return 'Set up your Campus Command account.';
    }
    switch (selectedRole) {
      case 'student':
        return 'Sign in to continue your placement journey.';
      case 'recruiter':
        return 'Sign in to find and connect with the right talent.';
      case 'tpo':
      default:
        return 'Sign in to continue managing campus placements.';
    }
  };

  const getEmailPlaceholder = () => {
    switch (selectedRole) {
      case 'student':
        return 'student@university.edu';
      case 'recruiter':
        return 'recruiter@company.com';
      case 'tpo':
      default:
        return 'tpo@university.edu';
    }
  };

  const handleSocialAuth = (providerName) => {
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      setLoading(false);
      const roleTitles = {
        student: 'Student Candidate',
        tpo: 'TPO Lead',
        recruiter: 'Enterprise Recruiter'
      };
      onAuthenticate({
        name: roleTitles[selectedRole],
        email: `${providerName.toLowerCase()}@${selectedRole === 'recruiter' ? 'company.com' : 'university.edu'}`,
        role: selectedRole,
        provider: providerName
      });
    }, 450);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const roleTitles = {
        student: fullName || 'Student Candidate',
        tpo: fullName || 'TPO Lead',
        recruiter: fullName || 'Corporate Recruiter'
      };
      onAuthenticate({
        name: roleTitles[selectedRole],
        email: email || getEmailPlaceholder(),
        role: selectedRole,
        provider: 'Email'
      });
    }, 450);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setForgotPasswordSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans antialiased flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-slate-900 selection:text-white">
      
      {/* Top Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to overview</span>
        </button>
      </div>

      {/* Centered Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-9 px-6 sm:px-10 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          
          {/* 1. Branding */}
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase pt-1">
              CAMPUS COMMAND
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Placement Operations, Simplified.
            </p>
          </div>

          {/* 2. Main Heading & Supporting Text */}
          <div className="text-center pt-2 border-t border-slate-100">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {getSupportingText()}
            </p>
          </div>

          {/* 3. Role Selection (Extremely simple inline selector) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              I am a
            </label>
            <div 
              role="radiogroup" 
              aria-label="Select User Role"
              className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-medium text-slate-600"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === 'student'}
                onClick={() => setSelectedRole('student')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === 'tpo'}
                onClick={() => setSelectedRole('tpo')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  selectedRole === 'tpo'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                TPO / Placement
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === 'recruiter'}
                onClick={() => setSelectedRole('recruiter')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                  selectedRole === 'recruiter'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Recruiter
              </button>
            </div>
          </div>

          {/* 4. Social Login Buttons (Equal size, white bg, light border, official recognizable icons) */}
          <div className="space-y-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialAuth('Google')}
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-xs font-medium text-slate-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.37 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => handleSocialAuth('LinkedIn')}
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-xs font-medium text-slate-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>Continue with LinkedIn</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialAuth('GitHub')}
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-xs font-medium text-slate-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="#181717" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* 5. Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Human-friendly Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 6. Email / Password Login or Signup Form */}
          {!showForgotPassword ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
              
              {/* Full Name in Signup Mode */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-xs"
                  />
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder={getEmailPlaceholder()}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError('');
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-xs pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password in Signup Mode */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-xs"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{mode === 'login' ? 'Signing you in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Box */
            <div className="space-y-4 text-xs">
              {!forgotPasswordSubmitted ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Enter your email address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={getEmailPlaceholder()}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    Send password reset instructions
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <div className="text-xs font-semibold text-emerald-900">
                    Reset instructions sent
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Check your inbox at <span className="font-semibold">{email}</span> for instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordSubmitted(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline pt-1 block mx-auto"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. Bottom Mode Toggle */}
          <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Create account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
