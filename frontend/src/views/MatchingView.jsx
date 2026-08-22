import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  Search, 
  Filter, 
  CheckSquare, 
  Square,
  Award,
  Layers,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function MatchingView({ 
  selectedDriveId, 
  drives = [], 
  onSelectDrive, 
  onSelectView 
}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, RECOMMENDED, APPROVED, WAITLISTED, REJECTED
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // TPO Action Modal State
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState('APPROVE');
  const [actionNotes, setActionNotes] = useState('');
  const [actionSaving, setActionSaving] = useState(false);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  useEffect(() => {
    if (activeDrive) {
      loadMatches(activeDrive.id);
    }
  }, [activeDrive?.id]);

  const loadMatches = async (driveId) => {
    try {
      setLoading(true);
      const data = await apiClient.getDriveMatches(driveId);
      setMatches(data);
      if (data.length > 0 && !selectedMatch) {
        setSelectedMatch(data[0]);
      }
      // Auto-select recommended candidates by default
      const recommendedIds = data.filter(m => m.is_shortlisted).map(m => m.id);
      setSelectedMatchIds(recommendedIds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!activeDrive) return;
    try {
      setGenerating(true);
      await apiClient.generateMatches(activeDrive.id);
      await loadMatches(activeDrive.id);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedMatchIds.length === filteredMatches.length) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(filteredMatches.map(m => m.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedMatchIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExecuteShortlistAction = async () => {
    if (selectedMatchIds.length === 0) return;
    try {
      setActionSaving(true);
      await apiClient.shortlistAction(
        selectedMatchIds,
        actionType,
        actionNotes || `TPO approved ${actionType} action for ${selectedMatchIds.length} candidates`,
        'TPO_ADMIN'
      );
      setActionModal(false);
      setActionNotes('');
      await loadMatches(activeDrive.id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionSaving(false);
    }
  };

  const handleProceedToScheduling = async () => {
    if (!activeDrive) return;
    try {
      // Advance drive stage to SHORTLIST_APPROVED
      await apiClient.advanceStage(activeDrive.id, 'SHORTLIST_APPROVED', 'TPO finalized shortlisted candidate pool');
      onSelectView('scheduling');
    } catch (err) {
      console.error(err);
      onSelectView('scheduling');
    }
  };

  // Filter calculations
  const filteredMatches = matches.filter(item => {
    const student = item.student || {};
    const matchesSearch = !searchQuery || 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'RECOMMENDED') matchesStatus = item.tpo_status === 'RECOMMENDED' || item.is_shortlisted;
    else if (statusFilter === 'APPROVED') matchesStatus = item.tpo_status === 'APPROVED';
    else if (statusFilter === 'WAITLISTED') matchesStatus = item.tpo_status === 'WAITLISTED';
    else if (statusFilter === 'REJECTED') matchesStatus = item.tpo_status === 'REJECTED';

    const matchesScore = item.overall_score >= minScoreFilter;

    return matchesSearch && matchesStatus && matchesScore;
  });

  const approvedCount = matches.filter(m => m.tpo_status === 'APPROVED').length;
  const recommendedCount = matches.filter(m => m.is_shortlisted).length;

  const handleExportCSV = () => {
    if (filteredMatches.length === 0) return;
    const headers = ['Rank', 'Name', 'Roll Number', 'Branch', 'CGPA', 'Match Score %', 'Skill Score %', 'Project Score %', 'Academic Score %', 'Readiness Score %', 'Semantic Sim %', 'TPO Status', 'Matched Skills', 'Missing Skills'];
    const rows = filteredMatches.map(m => [
      m.rank || '',
      `"${m.student?.name || ''}"`,
      `"${m.student?.roll_number || ''}"`,
      `"${m.student?.branch || ''}"`,
      m.student?.cgpa || '',
      m.overall_score,
      m.skill_score,
      m.project_score,
      m.academic_score,
      m.readiness_score,
      m.semantic_similarity,
      `"${m.tpo_status}"`,
      `"${(m.matched_skills || []).join(', ')}"`,
      `"${(m.missing_skills || []).join(', ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shortlist_${activeDrive?.drive_code || 'drive'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              MatchingAgent v2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Explainable Multi-Factor AI Ranking</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">AI Candidate Matching & Shortlisting</h1>
          <p className="text-xs text-slate-400">
            Explainable 4-factor scoring: Skills (40%), Projects (25%), Academics (20%), and Placement Readiness (15%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Export Shortlist CSV
          </button>
          <button
            onClick={handleGenerateMatches}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Ranking Candidates...' : 'Re-rank with Matching Agent'}
          </button>

          <button
            onClick={handleProceedToScheduling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02]"
          >
            Proceed to Interview Scheduling <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Drive Context & Shortlist TPO Action Bar */}
      {activeDrive && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{activeDrive.company?.name} — {activeDrive.role_title}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-500/20 text-purple-300">
                  {matches.length} Candidates Ranked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Required Skills: {activeDrive.required_skills?.join(', ')}
              </p>
            </div>
          </div>

          {/* Bulk TPO Actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {selectedMatchIds.length} Selected:
            </span>
            <button
              onClick={() => {
                setActionType('APPROVE');
                setActionModal(true);
              }}
              disabled={selectedMatchIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow disabled:opacity-40"
            >
              Approve Shortlist
            </button>
            <button
              onClick={() => {
                setActionType('WAITLIST');
                setActionModal(true);
              }}
              disabled={selectedMatchIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold disabled:opacity-40"
            >
              Waitlist
            </button>
            <button
              onClick={() => {
                setActionType('REJECT');
                setActionModal(true);
              }}
              disabled={selectedMatchIds.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold border border-slate-700 disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            {selectedMatchIds.length === filteredMatches.length && filteredMatches.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            Select All
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {['ALL', 'RECOMMENDED', 'APPROVED', 'WAITLISTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-400 text-[11px]">
          {filteredMatches.length} Candidates Ranked
        </span>
      </div>

      {/* Main Grid: Candidate Matching Leaderboard (7 cols) + Explainability Breakdown Radar (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Match Table */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#0E1526] text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-3 w-8">#</th>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3 text-center">Fit Score</th>
                  <th className="py-3 px-3">Skills Match</th>
                  <th className="py-3 px-3">TPO Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                      No candidates found matching the criteria. Run Matching Agent to rank eligible candidates.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((item) => {
                    const student = item.student || {};
                    const isSelected = selectedMatch?.id === item.id;
                    const isChecked = selectedMatchIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedMatch(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-600/15 border-l-2 border-purple-500'
                            : 'hover:bg-slate-850/50'
                        }`}
                      >
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(item.id)}
                            className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center">
                              {item.rank || '-'}
                            </span>
                            <div>
                              <div className="font-semibold text-white">{student.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{student.roll_number} • {student.branch}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-sm font-display font-bold ${
                              item.overall_score >= 80 ? 'text-emerald-400' : (item.overall_score >= 70 ? 'text-blue-400' : 'text-amber-400')
                            }`}>
                              {item.overall_score.toFixed(1)}%
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Sim: {(item.semantic_similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {item.matched_skills?.slice(0, 2).map((sk, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-medium truncate max-w-[80px]">
                                {sk}
                              </span>
                            ))}
                            {item.missing_skills?.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-medium truncate max-w-[80px]">
                                -{item.missing_skills[0]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {item.tpo_status === 'APPROVED' ? (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              APPROVED
                            </span>
                          ) : item.tpo_status === 'WAITLISTED' ? (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              WAITLISTED
                            </span>
                          ) : item.tpo_status === 'REJECTED' ? (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              REJECTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              RECOMMENDED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Explainability & Multi-Factor Breakdown Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {selectedMatch ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                      Rank #{selectedMatch.rank || 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedMatch.student?.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedMatch.student?.roll_number} • {selectedMatch.student?.branch} • CGPA {selectedMatch.student?.cgpa.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-emerald-400">
                    {selectedMatch.overall_score.toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">Overall Fit Index</div>
                </div>
              </div>

              {/* AI Narrative Recommendation */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1">
                <span className="font-bold text-purple-300 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Recommendation Summary:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedMatch.ai_recommendation_summary}
                </p>
              </div>

              {/* 4-Factor Weighted Score Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Multi-Factor Score Breakdown
                </h4>

                {/* Skill Score (40%) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">1. Technical Skill Coverage (40%)</span>
                    <span className="font-mono font-bold text-blue-400">{selectedMatch.skill_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${selectedMatch.skill_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Score (25%) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">2. Hands-on Project Relevance (25%)</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedMatch.project_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${selectedMatch.project_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Academic Score (20%) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">3. Academic Consistency (20%)</span>
                    <span className="font-mono font-bold text-purple-400">{selectedMatch.academic_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${selectedMatch.academic_score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Readiness Score (15%) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">4. Placement Readiness Index (15%)</span>
                    <span className="font-mono font-bold text-amber-400">{selectedMatch.readiness_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${selectedMatch.readiness_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Skills Match vs Missing comparison */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 block">
                    ✓ Verified Matched Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMatch.matched_skills?.map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedMatch.missing_skills?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-rose-400 block">
                      ⚠ Missing Core Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.missing_skills?.map((sk, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strengths & Risk Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                {selectedMatch.strength_highlights?.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-300">Key Strengths:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-emerald-400/90">
                      {selectedMatch.strength_highlights.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedMatch.risk_flags?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="font-bold text-slate-300">Risk Radar Flags:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-400/90">
                      {selectedMatch.risk_flags.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-500 italic text-xs">
              Select a candidate from the table to view multi-factor breakdown and explainability insights.
            </div>
          )}
        </div>
      </div>

      {/* TPO Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-400" />
                Confirm TPO Shortlist Decision
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1 text-xs">
              <div className="font-semibold text-white">
                Applying <span className="text-purple-400 uppercase font-bold">{actionType}</span> to {selectedMatchIds.length} candidate(s)
              </div>
              <p className="text-slate-400">
                This will update the candidate shortlist state and record an immutable entry in the TPO Audit Trail.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                TPO Decision Notes & Justification (Optional)
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Approved top 15 candidates meeting project relevance thresholds"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteShortlistAction}
                disabled={actionSaving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {actionSaving ? 'Applying...' : 'Confirm Decision & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
