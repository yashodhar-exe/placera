import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  BrainCircuit, 
  Calendar, 
  Inbox, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  Send,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function StitchCommandView({ 
  onSelectView, 
  onSelectDrive,
  onRefreshTrigger 
}) {
  const [kpis, setKpis] = useState({
    totalStudents: 120,
    placedCount: 0,
    placementPercentage: 0,
    activeDrivesCount: 0,
    avgPackageLPA: 12.4,
    peakPackageLPA: 28.0
  });
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');

  useEffect(() => {
    loadData();
  }, [onRefreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, drivesData] = await Promise.all([
        apiClient.getKPIs().catch(() => null),
        apiClient.getDrives().catch(() => [])
      ]);

      if (kpiData) {
        setKpis({
          totalStudents: kpiData.total_students || 120,
          placedCount: kpiData.placed_count || 0,
          placementPercentage: kpiData.placement_rate || 0,
          activeDrivesCount: drivesData.length || 0,
          avgPackageLPA: kpiData.avg_package_lpa || 12.4,
          peakPackageLPA: kpiData.peak_package_lpa || 28.0
        });
      } else {
        setKpis(prev => ({
          ...prev,
          activeDrivesCount: drivesData.length
        }));
      }

      setDrives(drivesData);
    } catch (err) {
      console.error('Failed to load Stitch command data', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">DRAFT</span>;
      case 'JD_PARSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">JD PARSED</span>;
      case 'ELIGIBILITY_PROCESSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ELIGIBILITY READY</span>;
      case 'SHORTLIST_PROPOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">TPO REVIEW</span>;
      case 'SHORTLIST_APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">SHORTLIST APPROVED</span>;
      case 'SCHEDULE_GENERATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">SCHEDULE READY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">{stage}</span>;
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#191C1D] font-sans antialiased pb-16">
      
      {/* Top Banner Context */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 sm:px-10 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#545F72] uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#1A365D]" />
              <span>Placement Season 2025–2026 · Academic Precision Design</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#002045] tracking-tight">
              University Placement Operations Command Center
            </h1>
            <p className="text-sm text-[#43474E] mt-1 max-w-2xl">
              Centralized autonomous coordination platform for JD intake, deterministic eligibility matching, and conflict-free interview scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('jd_intake')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#1A365D] hover:bg-[#002045] text-white font-medium text-xs sm:text-sm shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Intake New JD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        
        {/* KPI Strip (Stitch 4-Card Bento Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Total Pool */}
          <div className="bg-white border border-[#E2E8F0] rounded p-5 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#545F72]">Total Pool</span>
              <Users className="w-4 h-4 text-[#74777F]" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-[#002045] font-mono">{kpis.totalStudents}</div>
              <div className="text-xs text-[#545F72] mt-0.5">Registered Batch</div>
            </div>
          </div>

          {/* KPI 2: Placement % */}
          <div className="bg-white border border-[#E2E8F0] rounded p-5 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#545F72]">Placement %</span>
              <TrendingUp className="w-4 h-4 text-[#006A60]" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-[#006A60] font-mono">{kpis.placementPercentage}%</div>
              <div className="text-xs text-[#545F72] mt-0.5">{kpis.placedCount} Offers Accepted</div>
            </div>
          </div>

          {/* KPI 3: Active Drives */}
          <div className="bg-white border border-[#E2E8F0] rounded p-5 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#545F72]">Active Drives</span>
              <Briefcase className="w-4 h-4 text-[#74777F]" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-[#002045] font-mono">{kpis.activeDrivesCount}</div>
              <div className="text-xs text-[#545F72] mt-0.5">Companies on Campus</div>
            </div>
          </div>

          {/* KPI 4: Avg Package */}
          <div className="bg-white border border-[#E2E8F0] rounded p-5 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#545F72]">Avg Package</span>
              <DollarSign className="w-4 h-4 text-[#A67F00]" />
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-[#002045] font-mono">
                {kpis.avgPackageLPA} <span className="text-sm font-normal text-[#545F72]">LPA</span>
              </div>
              <div className="text-xs text-[#545F72] mt-0.5">Peak: {kpis.peakPackageLPA} LPA</div>
            </div>
          </div>

        </div>

        {/* Two Column Grid: Left (Active Pipeline) + Right (AI Modules) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left: Active Placement Drives Pipeline (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded p-6 shadow-xs">
            <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-bold text-[#002045]">Active Placement Drives Pipeline</h2>
                <p className="text-xs text-[#545F72] mt-0.5">Live recruitment drives synchronized with agent workflows</p>
              </div>

              <button
                onClick={() => onSelectView('jd_intake')}
                className="text-xs font-semibold text-[#1A365D] hover:text-[#002045] flex items-center gap-1 hover:underline"
              >
                <span>Create New</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drives List / Empty State */}
            <div className="mt-4">
              {drives.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center justify-center border border-dashed border-[#E2E8F0] rounded">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F5] flex items-center justify-center text-[#74777F] mb-3">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm text-[#191C1D]">No Active Drives In Pipeline</h3>
                  <p className="text-xs text-[#545F72] max-w-sm mt-1">
                    There are currently no placement drives ongoing. Ingest a new JD to launch automated eligibility audits and candidate matching.
                  </p>
                  <button
                    onClick={() => onSelectView('jd_intake')}
                    className="mt-4 px-4 py-2 rounded bg-[#1A365D] hover:bg-[#002045] text-white text-xs font-medium transition-colors"
                  >
                    + Ingest First JD
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {drives.map((drive) => (
                    <div
                      key={drive.id}
                      onClick={() => {
                        onSelectDrive(drive.id);
                        onSelectView('eligibility');
                      }}
                      className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F9FA] rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#F0F1F2] text-[#1A365D] font-bold text-xs flex items-center justify-center border border-[#E2E8F0]">
                          {drive.company?.name?.[0] || 'D'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#002045] flex items-center gap-2">
                            {drive.company?.name || 'Company'} — {drive.role_title}
                          </div>
                          <div className="text-xs text-[#545F72] flex items-center gap-3 mt-0.5">
                            <span>Min CGPA: {drive.min_cgpa || '7.0'}</span>
                            <span>•</span>
                            <span>CTC: {drive.ctc_lpa ? `${drive.ctc_lpa} LPA` : 'Standard'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {getStageBadge(drive.stage)}
                        <ChevronRight className="w-4 h-4 text-[#74777F]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Placement Modules (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#545F72] px-1">
              AI Placement Modules
            </h3>

            {/* Module 1: Eligibility & Overrides */}
            <div
              onClick={() => onSelectView('eligibility')}
              className="group bg-white border border-[#E2E8F0] hover:border-[#1A365D] rounded p-4 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[#E0F2F1] text-[#006A60] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#002045] group-hover:text-[#1A365D] flex items-center justify-between">
                    <span>Eligibility & Overrides</span>
                    <ChevronRight className="w-4 h-4 text-[#74777F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-[#545F72] mt-1 leading-snug">
                    Deterministic pass/fail evaluations across academic databases, active arrears, and gap policies.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 2: Explainable Matching */}
            <div
              onClick={() => onSelectView('matching')}
              className="group bg-white border border-[#E2E8F0] hover:border-[#1A365D] rounded p-4 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[#EDE7F6] text-[#512DA8] flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#002045] group-hover:text-[#1A365D] flex items-center justify-between">
                    <span>Explainable Matching</span>
                    <ChevronRight className="w-4 h-4 text-[#74777F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-[#545F72] mt-1 leading-snug">
                    Multi-factor candidate fit scores with resume-to-JD evidence justification trails.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 3: Interview Matrix */}
            <div
              onClick={() => onSelectView('scheduling')}
              className="group bg-white border border-[#E2E8F0] hover:border-[#1A365D] rounded p-4 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[#E3F2FD] text-[#0277BD] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#002045] group-hover:text-[#1A365D] flex items-center justify-between">
                    <span>Interview Matrix</span>
                    <ChevronRight className="w-4 h-4 text-[#74777F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-[#545F72] mt-1 leading-snug">
                    Combinatorial timetable optimization allocating campus labs and video links with 0 clashes.
                  </p>
                </div>
              </div>
            </div>

            {/* Module 4: Real-Time Exception Radar */}
            <div
              onClick={() => onSelectView('exceptions')}
              className="group bg-white border border-[#E2E8F0] hover:border-[#1A365D] rounded p-4 shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-[#FFF3E0] text-[#E65100] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#002045] group-hover:text-[#1A365D] flex items-center justify-between">
                    <span>Exception Radar</span>
                    <ChevronRight className="w-4 h-4 text-[#74777F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-[#545F72] mt-1 leading-snug">
                    Live detection and 1-click resolution for interviewer delays, student clashes, and room shifts.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
