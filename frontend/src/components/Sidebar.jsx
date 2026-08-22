import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Users,
  Calendar,
  ShieldCheck,
  Send,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  onSelectView, 
  openExceptionsCount = 0 
}) {
  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ]
    },
    {
      title: "PLACEMENT WORKFLOW",
      items: [
        {
          id: 'jd_intake',
          label: 'Job Drives',
          icon: Briefcase,
        },
        {
          id: 'eligibility',
          label: 'Eligibility',
          icon: CheckCircle2,
        },
        {
          id: 'matching',
          label: 'Candidates',
          icon: Users,
        },
        {
          id: 'scheduling',
          label: 'Interviews',
          icon: Calendar,
        },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        {
          id: 'exceptions',
          label: 'Approvals',
          icon: ShieldCheck,
          badgeCount: openExceptionsCount,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Send,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
        },
      ]
    },
    {
      title: "SETTINGS",
      items: [
        {
          id: 'audit',
          label: 'Settings',
          icon: Settings,
        },
      ]
    }
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-56px)] select-none">
      
      {/* Navigation Sections */}
      <div className="p-3 space-y-5">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-1">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer subtle return to landing page */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => onSelectView('landing')}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Landing Page</span>
        </button>
      </div>

    </aside>
  );
}
