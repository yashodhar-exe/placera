import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Send,
  ChevronRight
} from 'lucide-react';

export default function WorkflowSection() {
  const [hoveredStep, setHoveredStep] = useState(3); // default highlight on Approval

  const steps = [
    {
      num: '01',
      title: 'Requirements',
      short: 'JD Intake',
      icon: FileText,
      explanation: 'Parses unstructured PDF/email JDs into structured CTC tiers, department cutoffs, and skills.'
    },
    {
      num: '02',
      title: 'Eligibility',
      short: 'Zero-Hallucination',
      icon: CheckCircle,
      explanation: 'Deterministic verification against university SIS databases, standing arrears, and gap years.'
    },
    {
      num: '03',
      title: 'Matching',
      short: 'Skill Ranker',
      icon: Users,
      explanation: 'Scores candidate GitHub repositories, coursework, and projects with transparent match percentages.'
    },
    {
      num: '04',
      title: 'Approval',
      short: 'Human Gate',
      icon: ShieldCheck,
      isHumanGate: true,
      explanation: 'TPO reviews the AI recommendation, adjusts cutoffs if needed, and gives final sovereign authorization.'
    },
    {
      num: '05',
      title: 'Scheduling',
      short: 'Clash-Free Solver',
      icon: Calendar,
      explanation: 'Constraint optimizer that allocates candidate time slots across parallel panels with zero overlaps.'
    },
    {
      num: '06',
      title: 'Coordination',
      short: 'Venues & Alerts',
      icon: Send,
      explanation: 'Assigns campus labs, generates video links, dispatches WhatsApp/Email invites with RSVP tracking.'
    }
  ];

  return (
    <section id="workflow" className="py-14 md:py-18 bg-slate-50/70 border-y border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            One workflow. Every placement operation.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            From raw JD intake to final candidate notifications in six coordinated stages. Hover each step to explore.
          </p>
        </div>

        {/* 6-Step Horizontal / Responsive Workflow Ribbon */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-2.5 sm:gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = hoveredStep === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredStep(idx)}
                onClick={() => setHoveredStep(idx)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? step.isHumanGate 
                      ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900/10'
                      : 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                    <span className={isSelected ? (step.isHumanGate ? 'text-slate-900' : 'text-blue-600') : ''}>
                      {step.num}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${
                      isSelected 
                        ? (step.isHumanGate ? 'text-slate-900' : 'text-blue-600') 
                        : 'text-slate-400'
                    }`} />
                  </div>

                  <div className="mt-2.5 font-bold text-slate-900 text-xs sm:text-sm">
                    {step.title}
                  </div>

                  {step.isHumanGate && (
                    <span className="inline-block mt-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white">
                      HITL GATE
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                  {step.explanation}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
