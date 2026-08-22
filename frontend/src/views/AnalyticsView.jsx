import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  GraduationCap, 
  Flame, 
  Lightbulb,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function AnalyticsView() {
  const [skillGaps, setSkillGaps] = useState([]);
  const [deptReadiness, setDeptReadiness] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [gaps, depts] = await Promise.all([
        apiClient.getSkillGaps(),
        apiClient.getDepartmentReadiness()
      ]);
      setSkillGaps(gaps);
      setDeptReadiness(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL GAP</span>;
      case 'MODERATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MODERATE GAP</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BALANCED</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            AnalyticsAgent v2.0
          </span>
          <span className="text-xs text-slate-400 font-mono">Market Intelligence & Readiness Matrix</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mt-1">University Skill Gap & Placement Analytics</h1>
        <p className="text-xs text-slate-400">
          Compares industry recruiter demand against current student skill proficiency across departments to identify actionable curriculum & training interventions.
        </p>
      </div>

      {/* Top Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">Highest Skill Gap</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-white">System Design & Cloud</div>
          <p className="text-xs text-slate-400">
            Demand is <span className="text-rose-400 font-bold">56.7% higher</span> than student portfolio coverage in 4th year batch.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Strongest Foundation</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white">DSA & Python Core</div>
          <p className="text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">88.5%</span> of students possess verified proficiency for Tier 1 screening tests.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 bg-blue-950/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">TPO Readiness Index</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">78.4 / 100</div>
          <p className="text-xs text-slate-400">
            Average placement readiness score across active departments.
          </p>
        </div>
      </div>

      {/* University Skill Gap Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              University-Wide Skill Gap Matrix (Market Demand vs Student Supply)
            </h2>
            <p className="text-xs text-slate-400">Aggregated across all registered companies and verified student profiles</p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sorted by Gap Delta</span>
        </div>

        <div className="space-y-4">
          {skillGaps.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.skill}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.category})</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Impacted Candidates: <span className="font-semibold text-slate-200">{item.impacted_students_count} students</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getSeverityBadge(item.severity)}
                  <span className="text-sm font-mono font-bold text-rose-400">
                    Gap: {item.gap_pct}%
                  </span>
                </div>
              </div>

              {/* Progress Dual Bar */}
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Industry Recruiter Demand: <strong className="text-blue-400">{item.industry_demand_pct}%</strong></span>
                  <span>Student Proficiency: <strong className="text-emerald-400">{item.student_proficiency_pct}%</strong></span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                  {/* Student Proficiency */}
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${item.student_proficiency_pct}%` }}
                    title={`Student Proficiency: ${item.student_proficiency_pct}%`}
                  ></div>
                  {/* Gap */}
                  <div
                    className="h-full bg-rose-500/80"
                    style={{ width: `${Math.max(0, item.gap_pct)}%` }}
                    title={`Gap: ${item.gap_pct}%`}
                  ></div>
                </div>
              </div>

              {/* TPO Recommended Intervention */}
              <div className="p-2.5 rounded-lg bg-[#0D1424] border border-slate-800/80 text-xs flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-300">
                  <strong className="text-amber-300">TPO Action:</strong> {item.recommended_action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department-wise Readiness & Placement Rates */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Department Readiness & Placement Rate Comparison
          </h2>
          <p className="text-xs text-slate-400">Placement conversion and readiness benchmarks by academic discipline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptReadiness.map((dept, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">{dept.branch} Discipline</span>
                <span className="text-xs font-mono text-slate-400">{dept.total_students} Students</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Placed Rate</span>
                  <span className="text-lg font-bold text-emerald-400">{dept.placed_pct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Readiness</span>
                  <span className="text-lg font-bold text-blue-400">{dept.avg_readiness_score} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg CGPA</span>
                  <span className="font-semibold text-slate-200">{dept.avg_cgpa}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Offers Accepted</span>
                  <span className="font-semibold text-slate-200">{dept.placed_count}</span>
                </div>
              </div>

              {dept.top_missing_skills?.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                  <span className="text-[10px] text-rose-400 font-semibold">Priority Missing Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {dept.top_missing_skills.map((sk, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
