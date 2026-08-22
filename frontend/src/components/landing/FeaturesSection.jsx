import React, { useState } from 'react';
import { 
  FileCode2, 
  CheckCircle, 
  Sparkles, 
  Calendar, 
  Building2, 
  Send, 
  AlertTriangle, 
  BarChart3, 
  ArrowUpRight, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Layers
} from 'lucide-react';

export default function FeaturesSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    {
      id: 'jd-intel',
      title: 'JD Intelligence',
      tag: 'NLP Extraction',
      icon: FileCode2,
      description: 'Ingests messy corporate JDs across PDF, DOCX, and email threads. Automatically structures CTC breakups, department criteria, bond terms, and round definitions into clean JSON schemas.',
      highlight: 'Extracts 18+ placement parameters in < 400ms',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'eligibility',
      title: 'Eligibility Verification',
      tag: 'Zero-Hallucination',
      icon: CheckCircle,
      description: 'Deterministic audit engine cross-referencing university SIS records. Enforces CGPA cuts, active standing backlogs, gap years, and dream-tier reservation policies with 100% mathematical precision.',
      highlight: 'Zero AI hallucinations in academic checks',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'skill-match',
      title: 'Explainable Skill Matching',
      tag: 'Semantic & Evidence',
      icon: Sparkles,
      description: 'Scores student resumes and verified GitHub repositories against company tech stacks. Generates clear, human-readable justification percentages for why each candidate is recommended.',
      highlight: 'Transparent breakdown for DSA, ML, Cloud & Projects',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'scheduling',
      title: 'Interview Scheduling',
      tag: 'Combinatorial Solver',
      icon: Calendar,
      description: 'Autonomous constraint optimization that builds clash-free timetables across dozens of parallel interview tracks, accommodating panel availability, buffer times, and student schedules.',
      highlight: '100% elimination of double-booked candidates',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'panel-room',
      title: 'Panel & Room Coordination',
      tag: 'Hybrid Coordination',
      icon: Building2,
      description: 'Dynamically reserves physical campus lab rooms, generates dedicated virtual video meeting links, and dispatches encrypted interviewer briefing packets with candidate rubrics.',
      highlight: 'Syncs physical campus maps & virtual links',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
    },
    {
      id: 'notifications',
      title: 'Student Notifications',
      tag: 'Multi-Channel Alerting',
      icon: Send,
      description: 'Personalized dispatches across WhatsApp API, SMS, and Email. Includes calendar ICS invites, venue maps, and real-time attendance RSVP confirmation telemetry.',
      highlight: '98% delivery & read rate in under 3 seconds',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'exceptions',
      title: 'Exception Handling & Radar',
      tag: 'Real-Time Triage',
      icon: AlertTriangle,
      description: 'Proactive exception monitor detecting interviewer delays, student no-shows, or sudden technical issues. Immediately suggests one-click schedule rebalancing options to the TPO.',
      highlight: 'Self-healing schedule re-balancing with TPO consent',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
    },
    {
      id: 'analytics',
      title: 'Placement Analytics',
      tag: 'Accreditation Ready',
      icon: BarChart3,
      description: 'Real-time telemetry on offer conversion funnels, department placement velocity, salary percentiles, and recruiter SLAs. One-click export for NIRF, NAAC, and NBA audits.',
      highlight: 'Pre-formatted NAAC/NIRF compliance export',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Purpose-Built Platform Capabilities</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Engineered Specifically for High-Stakes Campus Placements
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Eight specialized autonomous agent modules designed to handle the complexity, volume, and urgency of university placement seasons.
          </p>
        </div>

        {/* 8 Features Grid (2x4 on desktop, 1 col on mobile) */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            const isHovered = hoveredCard === feat.id;

            return (
              <div
                key={feat.id}
                onMouseEnter={() => setHoveredCard(feat.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  {/* Top Bar with Icon & Tag */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${feat.badgeColor}`}>
                      {feat.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-4 font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Bottom Highlight Pill */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>{feat.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Strip */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Deterministic Rule Safety Guarantee
              </div>
              <div className="text-xs text-slate-600">
                Academic criteria checks never rely on generative probabilistic guesses—every filter is computed deterministically.
              </div>
            </div>
          </div>

          <a
            href="#sandbox"
            className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3.5 py-2 rounded-lg bg-blue-50/70 hover:bg-blue-50 border border-blue-200/80 transition-colors"
          >
            <span>Test in Interactive Sandbox</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
