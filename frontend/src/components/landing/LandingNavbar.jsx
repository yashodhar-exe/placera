import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';

export default function LandingNavbar({ onSignIn, onGetStarted }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-600 transition-colors">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            CAMPUS COMMAND
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#governance" className="hover:text-slate-900 transition-colors">
            Human Control
          </a>
        </nav>

        {/* Actions: Sign In | Get Started */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
          
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
          </button>
        </div>

      </div>
    </header>
  );
}
