import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';

export default function FinalCTASection({ onSignIn, onGetStarted }) {
  return (
    <section className="bg-slate-50/70 border-t border-slate-200/80 pt-14 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Compact CTA */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Make placement operations effortless.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Deploy in under 48 hours with zero student data retention and 100% human governance.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all"
            >
              <span>Start coordinating</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </button>

            <button
              onClick={onSignIn}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Very Small Minimal Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white text-[10px]">
              <Building2 className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800">CAMPUS COMMAND</span>
            <span className="text-slate-300">·</span>
            <span>Placement Operations</span>
            <span className="text-slate-300">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Coordination Engines Active
            </span>
            <button
              onClick={onSignIn}
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
