import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Cpu, 
  CheckCircle2, 
  Sliders, 
  AlertTriangle, 
  RotateCcw, 
  Check, 
  Lock, 
  FileCheck, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function HumanInTheLoopSection() {
  // Interactive simulator state for HITL decision
  const [selectedStudents, setSelectedStudents] = useState(['STU-01', 'STU-02', 'STU-03']);
  const [cutoffThreshold, setCutoffThreshold] = useState(8.0);
  const [isDecisionCommitted, setIsDecisionCommitted] = useState(false);
  const [overrideActive, setOverrideActive] = useState(false);

  const sampleCandidates = [
    { id: 'STU-01', name: 'Tanvi Agarwal', branch: 'CSE', cgpa: 8.92, aiScore: 95, skills: 'Cloud Architecture, Golang', reason: 'High match on microservices and distributed systems projects.' },
    { id: 'STU-02', name: 'Arjun Menon', branch: 'ECE', cgpa: 8.45, aiScore: 92, skills: 'Embedded C, CUDA, ROS', reason: 'Strong match with hardware acceleration & systems track.' },
    { id: 'STU-03', name: 'Sneha Patel', branch: 'IT', cgpa: 8.10, aiScore: 88, skills: 'React, Node, PostgreSQL', reason: 'Full-stack match with top 5% coding assessment score.' },
    { id: 'STU-04', name: 'Vikas Rao', branch: 'CSE', cgpa: 7.85, aiScore: 84, skills: 'Python, PyTorch, LangChain', reason: 'High AI skill match, but CGPA (7.85) is below current standard 8.0 cutoff.' },
  ];

  const handleToggleStudent = (id) => {
    if (isDecisionCommitted) return;
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(s => s !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleCommitDecision = () => {
    setIsDecisionCommitted(true);
  };

  const handleReset = () => {
    setIsDecisionCommitted(false);
    setSelectedStudents(['STU-01', 'STU-02', 'STU-03']);
    setOverrideActive(false);
  };

  return (
    <section id="hitl" className="py-20 md:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide shadow-sm">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Human-in-the-Loop Governance</span>
          </div>

          <h2 className="mt-6 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            “AI coordinates. Humans decide.”
          </h2>

          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Campus placement decisions define student careers and institutional reputations. 
            CampusOps AI is built on the strict principle that <span className="font-semibold text-slate-900">AI proposes and executes operational logistics</span>, but <span className="font-semibold text-slate-900">the Placement Officer and Dean hold 100% sovereign veto and sign-off authority</span>.
          </p>
        </div>

        {/* 4 Core Human Governance Principles */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">
              Hard Approval Gates
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              No shortlist is finalized, no recruiter dossier is dispatched, and no candidate is notified without explicit human confirmation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">
              One-Click Policy Overrides
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              TPOs can instantly override cutoffs, adjust skill weightings, waive backlog rules for exceptional cases, or swap panel slots on the fly.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">
              Explainable Decision Trails
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every single recommendation provides full natural language justification with exact evidence extracted from student resumes and records.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-base">
              Accreditation Audit Logs
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every action, override, and decision is cryptographically logged with timestamps, reviewer identities, and NIRF/NAAC compliant schemas.
            </p>
          </div>

        </div>

        {/* Side-by-Side Responsibility Breakdown: AI Coordinator vs TPO Authority */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* What AI Does (Operational Heavy Lifting) */}
            <div className="p-6 sm:p-8 bg-slate-50/40">
              <div className="flex items-center gap-2.5 text-blue-600 text-xs font-mono font-semibold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>What AI Agents Coordinate</span>
              </div>
              <h4 className="mt-2 text-xl font-bold text-slate-900">
                Automating 90% of Repetitive Placement Drudgery
              </h4>

              <ul className="mt-5 space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Parsing complex unstructured recruiter JDs into deterministic criteria schemas in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Cross-referencing 1,000+ student profiles against academic standing, CGPA, and backlog databases.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Calculating explainable semantic skill match scores with verifiable project evidence.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Solving complex room, lab, and interviewer timetable schedules with zero overlaps.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Dispatching multi-channel WhatsApp/Email alerts and monitoring real-time delivery receipts.</span>
                </li>
              </ul>
            </div>

            {/* What Humans Decide (Sovereign Authority) */}
            <div className="p-6 sm:p-8 bg-white">
              <div className="flex items-center gap-2.5 text-slate-900 text-xs font-mono font-semibold uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>What Humans (TPO & Deans) Decide</span>
              </div>
              <h4 className="mt-2 text-xl font-bold text-slate-900">
                100% Authority Over High-Stakes Institutional Decisions
              </h4>

              <ul className="mt-5 space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>Authorizing the official student shortlist before it is shared with corporate recruiters.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>Overriding cutoff thresholds or granting special exemptions for hackathon winners / athletes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>Enforcing university placement policies (e.g. Dream vs Super Dream job offer acceptance caps).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>Approving final offer rollouts and signing off on NIRF/NAAC statutory placement reports.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>Resolving critical exceptions (e.g. interviewer delays, medical leaves, or student disputes).</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Interactive Live HITL Decision Simulator */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 sm:p-8 shadow-lg">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                    Live HITL Simulator Widget
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Experience the TPO Sign-Off Console
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono">Simulate Decision:</span>
                <span className={`px-2.5 py-1 rounded font-mono font-bold ${
                  isDecisionCommitted 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {isDecisionCommitted ? 'STATUS: OFFICIALLY SIGNED OFF' : 'STATUS: WAITING FOR TPO CLICK'}
                </span>
              </div>
            </div>

            {/* Candidate Table to review */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
                <span>Drive: Morgan Stanley · Technology Analyst 2026</span>
                <span className="text-slate-500 font-normal">
                  {selectedStudents.length} of {sampleCandidates.length} Selected for Shortlist
                </span>
              </div>

              <div className="space-y-2.5">
                {sampleCandidates.map((candidate) => {
                  const isSelected = selectedStudents.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleToggleStudent(candidate.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${isDecisionCommitted ? 'pointer-events-none opacity-90' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            {candidate.name}
                            <span className="text-xs font-normal text-slate-500">
                              ({candidate.branch} · {candidate.cgpa} CGPA)
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {candidate.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {candidate.aiScore}% Match
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">
                          ID: {candidate.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {isDecisionCommitted ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Shortlist committed to database. Dispatch queue authorized for {selectedStudents.length} candidates.
                  </span>
                ) : (
                  <span>Click checkboxes to include/exclude candidates. Then click Approve to simulate TPO sign-off.</span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isDecisionCommitted ? (
                  <button
                    onClick={handleCommitDecision}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Authorize Shortlist ({selectedStudents.length})</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Simulator</span>
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
