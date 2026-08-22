import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  FilePlus,
  PlayCircle,
  FileCheck2,
  Award
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function CommandCenterOverview({ 
  onSelectView, 
  onSelectDrive, 
  onRefreshTrigger 
}) {
  const [kpis, setKpis] = useState(null);
  const [drives, setDrives] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [onRefreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiData, drivesData, exceptionsData] = await Promise.all([
        apiClient.getKPIs(),
        apiClient.getDrives(),
        apiClient.getExceptions('OPEN')
      ]);
      setKpis(kpiData);
      setDrives(drivesData);
      setExceptions(exceptionsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">DRAFT</span>;
      case 'JD_PARSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">JD PARSED</span>;
      case 'ELIGIBILITY_PROCESSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ELIGIBILITY READY</span>;
      case 'SHORTLIST_PROPOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">SHORTLIST PENDING</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">SCHEDULED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">{stage}</span>;
    }
  };

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-mono">Loading University Placement Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Welcome */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#10172A] to-[#151D33] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 9 AI AGENTS ACTIVE
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-medium">Placement Season 2025-2026</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              University Placement Operations Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Centralized Human-in-the-Loop coordination platform orchestrating JD intake, deterministic eligibility, explainable candidate matching, and conflict-free interview scheduling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectView('jd_intake')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <FilePlus className="w-4 h-4" />
              Intake New JD
            </button>
            <button
              onClick={() => onSelectView('exceptions')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Action Queue ({exceptions.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">Total Pool</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white">{kpis?.total_students || 120}</div>
          <div className="text-[10px] text-slate-400">Registered Graduating Batch</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">Placement %</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-400">{kpis?.placement_percentage || 0}%</div>
          <div className="text-[10px] text-slate-400">{kpis?.placed_students_count || 0} Offers Accepted</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">Active Drives</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white">{kpis?.active_drives_count || 0}</div>
          <div className="text-[10px] text-slate-400">Companies on Campus</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">Avg Package</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-300">{kpis?.average_ctc_lpa || 12.4} <span className="text-xs font-normal">LPA</span></div>
          <div className="text-[10px] text-slate-400">Peak: {kpis?.highest_ctc_lpa || 28.0} LPA</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">TPO Approvals</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-display font-bold text-purple-300">{kpis?.pending_tpo_approvals || 0}</div>
          <div className="text-[10px] text-slate-400">Pending Human Sign-off</div>
        </div>

        <div className={`glass-panel p-4 rounded-xl border space-y-2 ${exceptions.length > 0 ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase font-mono">Exceptions</span>
            <AlertTriangle className={`w-4 h-4 ${exceptions.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-display font-bold ${exceptions.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {exceptions.length}
          </div>
          <div className="text-[10px] text-slate-400">Active Sentinel Alerts</div>
        </div>
      </div>

      {/* Urgent HITL Action Queue (if any) */}
      {exceptions.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Urgent Placement Exceptions Requiring TPO Resolution</h3>
                <p className="text-xs text-rose-300/80">Autonomous Sentinel detected schedule or profile anomalies blocking pipeline progression</p>
              </div>
            </div>
            <button
              onClick={() => onSelectView('exceptions')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/40 transition-colors"
            >
              Open Exception Radar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exceptions.slice(0, 2).map((exc) => (
              <div key={exc.id} className="p-3.5 rounded-xl bg-[#0F1424] border border-rose-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {exc.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{exc.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{exc.description}</p>
                  <p className="text-[11px] text-emerald-400/90 font-medium">💡 Fix: {exc.suggested_resolution}</p>
                </div>
                <button
                  onClick={() => onSelectView('exceptions')}
                  className="shrink-0 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Recruitment Drives Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Active Placement Drives Pipeline</h2>
            <p className="text-xs text-slate-400">Track stage-by-stage progression from JD Intake to Offer Releases</p>
          </div>
          <button
            onClick={() => onSelectView('jd_intake')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            + Create New Drive
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((drive) => (
            <div
              key={drive.id}
              className="glass-panel-interactive p-5 rounded-xl border border-slate-800 space-y-4 cursor-pointer flex flex-col justify-between"
              onClick={() => {
                onSelectDrive(drive.id);
                if (drive.stage === 'DRAFT' || drive.stage === 'JD_PARSED') onSelectView('jd_intake');
                else if (drive.stage === 'ELIGIBILITY_PROCESSED') onSelectView('eligibility');
                else if (drive.stage === 'SHORTLIST_PROPOSED') onSelectView('matching');
                else if (drive.stage === 'SCHEDULED' || drive.stage === 'IN_PROGRESS') onSelectView('scheduling');
                else onSelectView('reports');
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">{drive.drive_code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {drive.tier}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{drive.company?.name || 'Company'}</h3>
                    <p className="text-xs text-slate-300 font-medium">{drive.role_title}</p>
                  </div>
                  {getStageBadge(drive.stage)}
                </div>

                {/* Requirements Chips */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Package (CTC)</span>
                    <span className="font-bold text-emerald-400">{drive.ctc_lpa} LPA</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min CGPA</span>
                    <span className="font-semibold text-slate-200">{drive.min_cgpa} Cutoff</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Openings</span>
                    <span className="font-semibold text-slate-200">{drive.openings} Positions</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Branches</span>
                    <span className="font-semibold text-slate-200 truncate">{drive.allowed_branches?.join(', ')}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {drive.required_skills?.slice(0, 3).map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {sk}
                    </span>
                  ))}
                  {drive.required_skills?.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 text-[10px]">
                      +{drive.required_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Drive Date: {drive.drive_date || 'TBD'}</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Drive <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white">AI Placement Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onSelectView('eligibility')}
            className="glass-panel-interactive p-4 rounded-xl text-left space-y-2 border border-slate-800"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Eligibility & Overrides</h3>
            <p className="text-xs text-slate-400">Evaluate candidates with transparent pass/fail condition breakdown & TPO override audit.</p>
          </button>

          <button
            onClick={() => onSelectView('matching')}
            className="glass-panel-interactive p-4 rounded-xl text-left space-y-2 border border-slate-800"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Explainable Matching</h3>
            <p className="text-xs text-slate-400">Multi-factor 4-component candidate ranking (Skills, Projects, CGPA, Readiness) with radar breakdown.</p>
          </button>

          <button
            onClick={() => onSelectView('scheduling')}
            className="glass-panel-interactive p-4 rounded-xl text-left space-y-2 border border-slate-800"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Interview Matrix</h3>
            <p className="text-xs text-slate-400">Coordinate rooms, labs, virtual links, and balance interviewer workloads with conflict detection.</p>
          </button>

          <button
            onClick={() => onSelectView('analytics')}
            className="glass-panel-interactive p-4 rounded-xl text-left space-y-2 border border-slate-800"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Skill Gap Matrix</h3>
            <p className="text-xs text-slate-400">Analyze market demand vs university student proficiency & recommend targeted bootcamps.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
