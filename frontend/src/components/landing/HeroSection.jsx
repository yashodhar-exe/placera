import React, { useState } from 'react';
import { 
  ArrowRight, 
  Check, 
  Users, 
  Calendar, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function HeroSection({ onLaunchConsole, onGetStarted }) {
  const [tpoApproved, setTpoApproved] = useState(false);

  const sampleCandidates = [
    { name: 'Ananya S.', branch: 'CSE', cgpa: 9.24, match: 96, skills: 'Distributed Systems, Go' },
    { name: 'Rohan D.', branch: 'ECE', cgpa: 8.81, match: 92, skills: 'C++, Computer Vision' },
    { name: 'Priya S.', branch: 'IT', cgpa: 8.65, match: 89, skills: 'Java, Kafka, PostgreSQL' },
  ];

  return (
    <section className="pt-12 pb-16 md:pt-16 md:pb-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          <span>AI-POWERED PLACEMENT OPERATIONS</span>
        </div>

        {/* Headline */}
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
          Coordinate campus placements. Intelligently.
        </h1>

        {/* Supporting text */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          From eligibility and candidate matching to interviews, scheduling and communication — let AI coordinate the workflow while your placement team stays in control.
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-sm transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <a
            href="#workflow"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
          >
            <span>See How It Works</span>
            <span className="text-slate-400">→</span>
          </a>
        </div>

        {/* COMPACT INTERACTIVE PLACEMENT DASHBOARD PREVIEW */}
        <div className="mt-12 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden max-w-4xl mx-auto">
            
            {/* Window Frame Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>
                <span className="h-3 w-px bg-slate-200 mx-1"></span>
                <span className="font-mono font-medium text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Drive: Goldman Sachs · SDE 2026
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Auto-Sync: 0 Clashes
                </span>
              </div>
            </div>

            {/* 4 Realistic Metrics Strip */}
            <div className="p-4 sm:p-5 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Active Drives</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">12</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">+3 this week</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Eligible Students</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">428</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">100% verified</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Interviews Today</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">36</div>
                  <div className="text-[10px] text-blue-600 font-medium mt-0.5">6 active panels</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Pending Actions</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {tpoApproved ? 0 : 3}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                    {tpoApproved ? 'All cleared' : 'Requires TPO sign-off'}
                  </div>
                </div>

              </div>

              {/* Compact Mini-Table + TPO Action */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* Candidate Snippet (8 cols) */}
                <div className="sm:col-span-8 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    AI Match Recommendations (Top 3 of 45)
                  </div>
                  <div className="space-y-1">
                    {sampleCandidates.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50/60 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{c.name}</span>
                          <span className="text-[10px] text-slate-500">{c.branch} · {c.cgpa} CGPA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-600 font-mono hidden md:inline">{c.skills}</span>
                          <span className="text-[11px] font-bold font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                            {c.match}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TPO Action Box (4 cols) */}
                <div className="sm:col-span-4 p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                      <span>TPO Decision Gate</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        tpoApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tpoApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      {tpoApproved 
                        ? 'Shortlist confirmed. Student alerts & interviewer packets dispatched.'
                        : 'Review 45 candidates & click to authorize dispatch.'}
                    </p>
                  </div>

                  <div className="mt-2.5">
                    {!tpoApproved ? (
                      <button
                        onClick={() => setTpoApproved(true)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve Shortlist</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setTpoApproved(false)}
                        className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Action</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
