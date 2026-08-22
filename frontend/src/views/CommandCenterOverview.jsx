import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  Calendar, 
  Check, 
  ChevronRight, 
  AlertCircle,
  FileText,
  BarChart3,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function CommandCenterOverview({ 
  onSelectView, 
  onSelectDrive, 
  onRefreshTrigger 
}) {
  const [kpis, setKpis] = useState({
    totalStudents: 120,
    activeDrivesCount: 4,
    interviewsToday: 18,
    offersAccepted: 32
  });
  const [drives, setDrives] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default priority action items
  const [actionItems, setActionItems] = useState([
    {
      id: 'act-1',
      company: 'Google',
      title: 'Candidate approval',
      description: '24 candidates are ready for review',
      actionText: 'Review candidates',
      viewTarget: 'matching',
      urgency: 'high'
    },
    {
      id: 'act-2',
      company: 'TCS',
      title: 'Interview scheduling',
      description: '3 panel conflicts need resolution',
      actionText: 'Resolve conflicts',
      viewTarget: 'scheduling',
      urgency: 'medium'
    },
    {
      id: 'act-3',
      company: 'Infosys',
      title: 'Pending confirmations',
      description: '18 students haven\'t confirmed',
      actionText: 'View students',
      viewTarget: 'eligibility',
      urgency: 'low'
    }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, [onRefreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiData, drivesData, exceptionsData] = await Promise.all([
        apiClient.getKPIs().catch(() => null),
        apiClient.getDrives().catch(() => []),
        apiClient.getExceptions('OPEN').catch(() => [])
      ]);

      if (kpiData) {
        setKpis({
          totalStudents: kpiData.total_students || 120,
          activeDrivesCount: drivesData.length || 4,
          interviewsToday: kpiData.interviews_today || 18,
          offersAccepted: kpiData.placed_count || 32
        });
      } else if (drivesData.length > 0) {
        setKpis(prev => ({
          ...prev,
          activeDrivesCount: drivesData.length
        }));
      }

      setDrives(drivesData);
      setExceptions(exceptionsData || []);

      // If backend has real exceptions, map them to priority actions
      if (exceptionsData && exceptionsData.length > 0) {
        const mapped = exceptionsData.slice(0, 3).map(exc => ({
          id: `exc-${exc.id}`,
          company: exc.drive?.company?.name || 'Recruitment Drive',
          title: exc.title || 'Action Required',
          description: exc.description || 'Pending TPO resolution',
          actionText: 'Resolve issue',
          viewTarget: 'exceptions',
          urgency: exc.severity === 'CRITICAL' ? 'high' : 'medium'
        }));
        setActionItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (onSelectView) {
      onSelectView(action.viewTarget);
    }
  };

  // Sample drives fallback if database is empty
  const displayDrives = drives.length > 0 ? drives : [
    {
      id: 'drv-google',
      company: { name: 'Google' },
      role_title: 'SDE Intern',
      candidateCount: 24,
      stage: 'SHORTLIST_PROPOSED',
      stageLabel: 'Matching',
      actionLabel: 'Review'
    },
    {
      id: 'drv-tcs',
      company: { name: 'TCS' },
      role_title: 'Graduate Engineer',
      candidateCount: 58,
      stage: 'SCHEDULED',
      stageLabel: 'Interviews',
      actionLabel: 'Manage'
    },
    {
      id: 'drv-infosys',
      company: { name: 'Infosys' },
      role_title: 'Software Engineer',
      candidateCount: 31,
      stage: 'ELIGIBILITY_PROCESSED',
      stageLabel: 'Eligibility',
      actionLabel: 'Review'
    }
  ];

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'SHORTLIST_PROPOSED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Matching</span>;
      case 'SCHEDULED':
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">Interviews</span>;
      case 'ELIGIBILITY_PROCESSED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Eligibility</span>;
      case 'SHORTLIST_APPROVED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">Approved</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Completed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{stage}</span>;
    }
  };

  const workflowStages = [
    { name: 'Job Drive', count: '4 active', status: 'In progress', active: false },
    { name: 'Eligibility', count: '120 verified', status: 'Completed', active: false },
    { name: 'Matching', count: '24 candidates', status: 'Needs review', active: true },
    { name: 'Approval', count: '3 pending', status: 'TPO Gate', active: false },
    { name: 'Interview', count: '18 today', status: '6 panels', active: false },
    { name: 'Offer', count: '32 accepted', status: 'Released', active: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-16">
      
      {/* 3. DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, TPO Lead 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your placement drives today.
          </p>
          
          {/* Action indicator link */}
          <div className="mt-2">
            {actionItems.length > 0 ? (
              <button
                onClick={() => {
                  const el = document.getElementById('needs-attention-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{actionItems.length} actions need your attention</span>
                <span>→</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>You're all caught up.</span>
              </span>
            )}
          </div>
        </div>

        {/* Strongest Primary CTA */}
        <div>
          <button
            onClick={() => onSelectView('jd_intake')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Job Drive</span>
          </button>
        </div>
      </div>

      {/* 4. PRIORITY / ACTION AREA ("Needs your attention") */}
      <div id="needs-attention-section" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Needs your attention
            </h2>
            {actionItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {actionItems.length}
              </span>
            )}
          </div>

          {actionItems.length > 0 && (
            <span className="text-xs text-slate-400">
              High priority placement decisions
            </span>
          )}
        </div>

        {actionItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {actionItems.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
                    item.urgency === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></span>
                  <div>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.company} — {item.title}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {item.description}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleActionClick(item)}
                  className="self-start sm:self-auto text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>{item.actionText}</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <div className="text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All caught up. No pending placement actions right now.</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. 4 KEY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Students */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Students</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {kpis.totalStudents}
          </div>
          <div className="text-xs text-slate-500 mt-1">registered</div>
        </div>

        {/* Metric 2: Active Drives */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active Drives</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {kpis.activeDrivesCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">companies</div>
        </div>

        {/* Metric 3: Interviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Interviews</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {kpis.interviewsToday}
          </div>
          <div className="text-xs text-slate-500 mt-1">today</div>
        </div>

        {/* Metric 4: Offers (Green for success) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Offers</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {kpis.offersAccepted}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">accepted</div>
        </div>

      </div>

      {/* 6. PLACEMENT WORKFLOW TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Placement workflow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track every drive from job posting to final offer.
          </p>
        </div>

        {/* Horizontal Timeline (Stackable on mobile) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {workflowStages.map((stg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border transition-all ${
                stg.active
                  ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-500/20'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>0{i + 1}</span>
                {stg.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
              </div>
              <div className={`mt-1 font-bold text-xs ${stg.active ? 'text-blue-950' : 'text-slate-800'}`}>
                {stg.name}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {stg.count}
              </div>
              <div className={`text-[10px] font-medium mt-1 ${
                stg.active ? 'text-blue-700 font-semibold' : 'text-slate-400'
              }`}>
                {stg.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. ACTIVE JOB DRIVES TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Active job drives
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live recruitment drives and candidate counts
            </p>
          </div>

          <button
            onClick={() => onSelectView('jd_intake')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-2.5 font-normal">Company</th>
                <th className="py-2.5 font-normal">Role</th>
                <th className="py-2.5 font-normal">Candidates</th>
                <th className="py-2.5 font-normal">Stage</th>
                <th className="py-2.5 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayDrives.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900">
                    {d.company?.name || 'Company'}
                  </td>
                  <td className="py-3 text-slate-600">
                    {d.role_title}
                  </td>
                  <td className="py-3 font-mono text-slate-800">
                    {d.candidateCount || 24}
                  </td>
                  <td className="py-3">
                    {getStageBadge(d.stage)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        if (onSelectDrive) onSelectDrive(d.id);
                        if (d.stage === 'SHORTLIST_PROPOSED') onSelectView('matching');
                        else if (d.stage === 'SCHEDULED') onSelectView('scheduling');
                        else onSelectView('eligibility');
                      }}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-medium text-xs shadow-2xs hover:bg-slate-50 transition-all"
                    >
                      {d.actionLabel || 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. QUICK ACTIONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Action 1 */}
        <div
          onClick={() => onSelectView('jd_intake')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Plus className="w-4 h-4" />
          </div>
          <div className="mt-3 font-bold text-xs text-slate-900">
            Create Job Drive
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Create a new company requirement.
          </div>
        </div>

        {/* Action 2 */}
        <div
          onClick={() => onSelectView('matching')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-3 font-bold text-xs text-slate-900">
            Review Candidates
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            View eligible and matched students.
          </div>
        </div>

        {/* Action 3 */}
        <div
          onClick={() => onSelectView('scheduling')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="mt-3 font-bold text-xs text-slate-900">
            Schedule Interviews
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Manage panels, rooms and time slots.
          </div>
        </div>

        {/* Action 4 */}
        <div
          onClick={() => onSelectView('reports')}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="mt-3 font-bold text-xs text-slate-900">
            View Reports
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            See placement progress and analytics.
          </div>
        </div>

      </div>

      {/* 10. HUMAN-IN-THE-LOOP TRUST FOOTNOTE */}
      <div className="pt-4 pb-2 border-t border-slate-200 text-center">
        <div className="text-xs font-semibold text-slate-800">
          AI coordinates. You decide.
        </div>
        <p className="text-xs text-slate-500 mt-0.5 max-w-xl mx-auto leading-relaxed">
          The system recommends candidates, schedules interviews and detects conflicts. Final placement decisions always remain with the TPO.
        </p>
      </div>

    </div>
  );
}
