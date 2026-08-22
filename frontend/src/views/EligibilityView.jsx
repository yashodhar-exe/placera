import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  RotateCw, 
  ShieldAlert, 
  ArrowRight, 
  SlidersHorizontal, 
  Sparkles,
  Info,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function EligibilityView({ 
  selectedDriveId, 
  drives = [], 
  onSelectDrive, 
  onSelectView 
}) {
  const [eligibilityList, setEligibilityList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  
  // Filters
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ELIGIBLE, EXCLUDED, OVERRIDDEN
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student for Deep Explainability Inspector
  const [selectedItem, setSelectedItem] = useState(null);

  // Override Modal State
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  useEffect(() => {
    if (activeDrive) {
      loadEligibility(activeDrive.id);
    }
  }, [activeDrive?.id]);

  const loadEligibility = async (driveId) => {
    try {
      setLoading(true);
      const data = await apiClient.getDriveEligibility(driveId);
      setEligibilityList(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReevaluate = async () => {
    if (!activeDrive) return;
    try {
      setEvaluating(true);
      await apiClient.evaluateEligibility(activeDrive.id);
      await loadEligibility(activeDrive.id);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideTarget || !overrideReason.trim()) return;
    try {
      setOverrideSaving(true);
      const newStatus = !overrideTarget.is_eligible;
      await apiClient.overrideEligibility(
        activeDrive.id,
        overrideTarget.student_id,
        newStatus,
        overrideReason,
        'TPO_ADMIN'
      );
      setOverrideTarget(null);
      setOverrideReason('');
      await loadEligibility(activeDrive.id);
    } catch (err) {
      console.error(err);
    } finally {
      setOverrideSaving(false);
    }
  };

  // Filter calculations
  const filteredList = eligibilityList.filter(item => {
    const student = item.student || {};
    const matchesBranch = !branchFilter || student.branch === branchFilter;
    const matchesSearch = !searchQuery || 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'ELIGIBLE') matchesStatus = item.is_eligible;
    else if (statusFilter === 'EXCLUDED') matchesStatus = !item.is_eligible;
    else if (statusFilter === 'OVERRIDDEN') matchesStatus = item.is_overridden;

    return matchesBranch && matchesSearch && matchesStatus;
  });

  const eligibleCount = eligibilityList.filter(e => e.is_eligible).length;
  const excludedCount = eligibilityList.filter(e => !e.is_eligible).length;
  const overriddenCount = eligibilityList.filter(e => e.is_overridden).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Drive Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              EligibilityAgent
            </span>
            <span className="text-xs text-slate-400 font-mono">Deterministic Rule Verification</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Student Eligibility Verification</h1>
          <p className="text-xs text-slate-400">
            Rules evaluated deterministically across CGPA, branch, backlogs, and university tier upgrade policy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReevaluate}
            disabled={evaluating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Re-evaluating...' : 'Re-run Rules'}
          </button>

          <button
            onClick={() => onSelectView('matching')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            Proceed to AI Matching <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drive Context Summary Card */}
      {activeDrive && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
              {activeDrive.company?.name?.slice(0, 2).toUpperCase() || 'DR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{activeDrive.company?.name} — {activeDrive.role_title}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300">
                  {activeDrive.tier} ({activeDrive.ctc_lpa} LPA)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cutoff: CGPA &ge; {activeDrive.min_cgpa} | Branches: {activeDrive.allowed_branches?.join(', ')} | Max Backlogs: {activeDrive.max_active_backlogs}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-medium">
              <span className="font-bold text-emerald-400">{eligibleCount}</span> Eligible
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-medium">
              <span className="font-bold text-rose-400">{excludedCount}</span> Excluded
            </div>
            {overriddenCount > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-medium">
                <span className="font-bold text-amber-400">{overriddenCount}</span> Overridden by TPO
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
          </select>

          {/* Status Tabs */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {['ALL', 'ELIGIBLE', 'EXCLUDED', 'OVERRIDDEN'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-400 text-[11px]">
          Showing {filteredList.length} of {eligibilityList.length} candidates
        </span>
      </div>

      {/* Main Grid: Candidate Table (7 cols) + Explainability Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table View */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#0E1526] text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">CGPA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                      No candidates found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const student = item.student || {};
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-600/15 border-l-2 border-blue-500'
                            : 'hover:bg-slate-850/50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{student.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{student.roll_number}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium">{student.branch}</td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-bold ${
                            student.cgpa >= (activeDrive?.min_cgpa || 7.0) ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {student.cgpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.is_eligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" /> Excluded
                            </span>
                          )}
                          {item.is_overridden && (
                            <span className="block text-[9px] font-mono text-amber-400 mt-0.5 font-bold">
                              [TPO Override]
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOverrideTarget(item);
                              setOverrideReason('');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700"
                          >
                            Override
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Deep Explainability Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center font-bold text-blue-400 text-xs">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedItem.student?.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedItem.student?.roll_number} • {selectedItem.student?.branch}</p>
                  </div>
                </div>
                {selectedItem.is_eligible ? (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> EXCLUDED
                  </span>
                )}
              </div>

              {/* Exclusion Reasons Alert (if any) */}
              {selectedItem.exclusion_reasons?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1 text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" /> Exclusion Reasons:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 text-[11px]">
                    {selectedItem.exclusion_reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itemized Deterministic Condition Checks */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Rule Evaluation Matrix
                </h4>

                {/* CGPA Check */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">CGPA Cutoff Rule</span>
                    {selectedItem.reason_breakdown?.cgpa_check?.pass ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <Check className="w-3 h-3" /> PASS ({selectedItem.student?.cgpa.toFixed(2)} &ge; {activeDrive?.min_cgpa})
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold text-[11px]">
                        <X className="w-3 h-3" /> FAIL ({selectedItem.student?.cgpa.toFixed(2)} &lt; {activeDrive?.min_cgpa})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{selectedItem.reason_breakdown?.cgpa_check?.status_text}</p>
                </div>

                {/* Branch Check */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Branch Eligibility Rule</span>
                    {selectedItem.reason_breakdown?.branch_check?.pass ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <Check className="w-3 h-3" /> PASS ({selectedItem.student?.branch})
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold text-[11px]">
                        <X className="w-3 h-3" /> FAIL ({selectedItem.student?.branch} not in list)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{selectedItem.reason_breakdown?.branch_check?.status_text}</p>
                </div>

                {/* Active Backlogs Check */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Active Backlogs Check</span>
                    {selectedItem.reason_breakdown?.active_backlogs_check?.pass ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <Check className="w-3 h-3" /> PASS ({selectedItem.student?.active_backlogs} Backlogs)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold text-[11px]">
                        <X className="w-3 h-3" /> FAIL ({selectedItem.student?.active_backlogs} &gt; {activeDrive?.max_active_backlogs})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{selectedItem.reason_breakdown?.active_backlogs_check?.status_text}</p>
                </div>

                {/* Tier Policy Check */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Placement Upgrade Policy</span>
                    {selectedItem.reason_breakdown?.tier_policy_check?.pass ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <Check className="w-3 h-3" /> PASS ({selectedItem.student?.placement_status})
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-bold text-[11px]">
                        <X className="w-3 h-3" /> RESTRICTED ({selectedItem.student?.placement_status})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Current: {selectedItem.student?.current_company || 'Unplaced'} ({selectedItem.student?.current_package_lpa || 0} LPA)
                  </p>
                </div>
              </div>

              {/* Override Status (if any) */}
              {selectedItem.is_overridden && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" /> TPO Human Override Active
                  </span>
                  <p className="text-[11px] text-amber-200 font-medium">"{selectedItem.override_reason}"</p>
                  <p className="text-[10px] text-slate-400 font-mono">By: {selectedItem.overridden_by || 'TPO_ADMIN'}</p>
                </div>
              )}

              {/* TPO Override Button */}
              <button
                onClick={() => {
                  setOverrideTarget(selectedItem);
                  setOverrideReason('');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                {selectedItem.is_eligible ? 'Force Exclude Candidate (Override)' : 'Grant Eligibility Exception (Override)'}
              </button>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-500 italic text-xs">
              Select a candidate from the table to view itemized rule explainability.
            </div>
          )}
        </div>
      </div>

      {/* TPO Override Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleApplyOverride} className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Human-in-the-Loop Eligibility Override
              </h3>
              <button
                type="button"
                onClick={() => setOverrideTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1 text-xs">
              <div className="font-semibold text-white">{overrideTarget.student?.name} ({overrideTarget.student?.roll_number})</div>
              <div className="text-slate-400">
                Action: Switching status from <span className="font-bold text-white">{overrideTarget.is_eligible ? 'ELIGIBLE' : 'EXCLUDED'}</span> to <span className="font-bold text-emerald-400">{!overrideTarget.is_eligible ? 'ELIGIBLE' : 'EXCLUDED'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Mandatory Reason for Override (Logged to Audit Trail) *
              </label>
              <textarea
                rows={3}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Dean's special approval for ACM-ICPC finalist / Recruiter waiver granted"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverrideTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={overrideSaving || !overrideReason.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
              >
                {overrideSaving ? 'Applying...' : 'Confirm & Log Audit Record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
