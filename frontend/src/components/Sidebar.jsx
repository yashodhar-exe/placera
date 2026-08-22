import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  BrainCircuit,
  CalendarDays,
  AlertOctagon,
  BarChart3,
  FileSpreadsheet,
  Send,
  History,
  Bot,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  onSelectView, 
  openExceptionsCount = 0, 
  pendingApprovalsCount = 0 
}) {
  const navSections = [
    {
      title: "PLACEMENT WORKFLOW",
      items: [
        {
          id: 'overview',
          label: 'Command Overview',
          icon: LayoutDashboard,
          badge: null,
          color: 'text-blue-400'
        },
        {
          id: 'jd_intake',
          label: 'JD Intake & AI Extraction',
          icon: FileText,
          badge: 'JDIntakeAgent',
          color: 'text-indigo-400'
        },
        {
          id: 'eligibility',
          label: 'Eligibility & Overrides',
          icon: CheckCircle2,
          badge: 'EligibilityAgent',
          color: 'text-emerald-400'
        },
        {
          id: 'matching',
          label: 'AI Candidate Matching',
          icon: BrainCircuit,
          badge: 'MatchingAgent',
          color: 'text-purple-400'
        },
        {
          id: 'scheduling',
          label: 'Schedule & Venue Matrix',
          icon: CalendarDays,
          badge: 'SchedulingAgent',
          color: 'text-cyan-400'
        }
      ]
    },
    {
      title: "OPERATIONS & INTELLIGENCE",
      items: [
        {
          id: 'exceptions',
          label: 'Exception Action Radar',
          icon: AlertOctagon,
          badge: openExceptionsCount > 0 ? `${openExceptionsCount} Alert` : null,
          isAlert: openExceptionsCount > 0,
          color: 'text-rose-400'
        },
        {
          id: 'analytics',
          label: 'Skill Gap & Readiness',
          icon: BarChart3,
          badge: 'AnalyticsAgent',
          color: 'text-amber-400'
        },
        {
          id: 'reports',
          label: 'Drive Funnel & Reports',
          icon: FileSpreadsheet,
          badge: 'ReportingAgent',
          color: 'text-teal-400'
        },
        {
          id: 'notifications',
          label: 'Broadcast & Notices',
          icon: Send,
          badge: 'NotificationAgent',
          color: 'text-sky-400'
        },
        {
          id: 'audit',
          label: 'HITL Audit Trail',
          icon: History,
          badge: 'Immutable',
          color: 'text-slate-400'
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0A0E1A] border-r border-slate-800/80 flex flex-col justify-between select-none shrink-0 min-h-[calc(100vh-57px)]">
      <div className="p-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : item.color} group-hover:scale-110 transition-transform`} />
                      <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          item.isAlert
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : isActive
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Banner */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>HITL Governance</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ENFORCED
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          AI agents provide ranked recommendations & schedules. All final selection & exclusion decisions require TPO sign-off.
        </p>
      </div>
    </aside>
  );
}
