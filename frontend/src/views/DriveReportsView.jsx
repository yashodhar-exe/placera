import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Award, 
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function DriveReportsView({ 
  selectedDriveId, 
  drives = [], 
  onSelectDrive 
}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  useEffect(() => {
    if (activeDrive) {
      loadReport(activeDrive.id);
    }
  }, [activeDrive?.id]);

  const loadReport = async (driveId) => {
    try {
      setLoading(true);
      const data = await apiClient.getDriveReport(driveId);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportReportCSV = () => {
    if (!report) return;
    const lines = [
      `Placement Drive Report - ${report.company_name} (${report.role_title})`,
      `Drive Code,${report.drive_code}`,
      `Package,${report.ctc_lpa} LPA`,
      `Tier,${report.tier}`,
      `Total Applicants,${report.total_applicants}`,
      `Eligible Count,${report.eligible_count} (${report.eligibility_rate_pct}%)`,
      `Shortlisted Count,${report.shortlisted_count}`,
      `Interviews Conducted,${report.interviews_conducted}`,
      `Offers Made,${report.offers_made} (${report.conversion_rate_pct}%)`,
      '',
      'Department Breakdown',
      ...Object.entries(report.department_breakdown || {}).map(([dept, count]) => `${dept},${count}`)
    ];

    const csvContent = "data:text/csv;charset=utf-8," + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `drive_report_${report.drive_code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
              ReportingAgent v2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Executive Yield & Conversion Analytics</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Placement Drive Executive Report</h1>
          <p className="text-xs text-slate-400">
            Comprehensive audit report containing conversion funnels, yield rates, interview completion statistics, and department breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Official Report
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0E1726] to-[#121E36] space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-400 text-lg">
                  {report.company_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-400">{report.drive_code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                      {report.tier} Tier
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">{report.company_name} — {report.role_title}</h2>
                  <p className="text-xs text-slate-400">Package: <strong className="text-emerald-400">{report.ctc_lpa} LPA</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-2xl font-display font-bold text-emerald-400">{report.offers_made}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Offers Released</div>
                </div>
                <div className="pl-4 border-l border-slate-800">
                  <div className="text-2xl font-display font-bold text-blue-400">{report.conversion_rate_pct}%</div>
                  <div className="text-[10px] text-slate-400 font-mono">Conversion Yield</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recruitment Funnel Visualizer */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                Recruitment Funnel & Candidate Progression
              </h3>
              <p className="text-xs text-slate-400">Yield and drop-off rates across each recruitment checkpoint</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">1. Total Pool</span>
                <div className="text-2xl font-display font-bold text-white">{report.total_applicants}</div>
                <div className="text-[10px] text-slate-400">Graduating Batch</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">2. Eligible</span>
                <div className="text-2xl font-display font-bold text-emerald-400">{report.eligible_count}</div>
                <div className="text-[10px] text-slate-400">{report.eligibility_rate_pct}% Criteria Met</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">3. Shortlisted</span>
                <div className="text-2xl font-display font-bold text-purple-400">{report.shortlisted_count}</div>
                <div className="text-[10px] text-slate-400">AI Match Fit Ranked</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">4. Interviewed</span>
                <div className="text-2xl font-display font-bold text-cyan-400">{report.interviews_conducted}</div>
                <div className="text-[10px] text-slate-400">{report.no_show_count} No-Shows</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-center">
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">5. Selected</span>
                <div className="text-2xl font-display font-bold text-emerald-400">{report.offers_made}</div>
                <div className="text-[10px] text-emerald-300/80">{report.conversion_rate_pct}% Final Yield</div>
              </div>
            </div>
          </div>

          {/* Department Breakdown & Skills Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Department-wise Shortlist Breakdown
              </h3>

              <div className="space-y-2">
                {Object.entries(report.department_breakdown || {}).map(([dept, count], idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dept} Engineering</span>
                    <span className="font-mono font-bold text-blue-400">{count} Candidates</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Stages Timeline */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Drive Lifecycle Execution Milestones
              </h3>

              <div className="space-y-2.5">
                {report.timeline_summary?.map((t, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{t.stage}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
