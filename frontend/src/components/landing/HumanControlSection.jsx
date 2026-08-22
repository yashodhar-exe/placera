import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  UserCheck, 
  Check, 
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';

export default function HumanControlSection() {
  const [isApproved, setIsApproved] = useState(false);

  return (
    <section id="governance" className="py-14 md:py-18 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Human-in-the-Loop Governance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            AI coordinates. Humans decide.
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
            The agent parses criteria, recommends candidates, resolves timetable clashes, and automates multi-channel notifications. The Placement Officer maintains 100% authoritative control over final shortlists and key decisions.
          </p>
        </div>

        {/* Small AI Recommendation → TPO Approval Visual */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: AI Recommendation Card */}
            <div className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  AI Agent Recommendation
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  94.8% Match Fit
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-700 font-medium">
                "Shortlist top 45 candidates for Amazon AWS technical round. 0 schedule clashes detected."
              </p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Status: Staged · Awaiting TPO Sign-off
              </div>
            </div>

            {/* Middle: Arrow indicator */}
            <div className="hidden md:flex flex-col items-center gap-1 text-slate-400">
              <div className="w-8 h-px bg-slate-300"></div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Right: TPO Approval Gate */}
            <div className="w-full md:w-1/2 p-3.5 rounded-xl bg-white border-2 border-slate-900 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-900" />
                    TPO Sovereign Sign-Off
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {isApproved ? 'AUTHORIZED' : 'ACTION REQUIRED'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {isApproved 
                    ? '✓ Shortlist authorized by TPO. Dispatches sent to students & interviewers.'
                    : 'Review proposed shortlist & click to release schedule.'}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                {!isApproved ? (
                  <button
                    onClick={() => setIsApproved(true)}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve Decision</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsApproved(false)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Simulation</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
