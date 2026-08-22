import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  ArrowRight, 
  Sliders, 
  Building2, 
  Sparkles,
  Send,
  Star,
  FileCheck
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function SchedulingView({ 
  selectedDriveId, 
  drives = [], 
  onSelectDrive, 
  onSelectView 
}) {
  const [schedules, setSchedules] = useState([]);
  const [panels, setPanels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [panelLoads, setPanelLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate Options Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genOptions, setGenOptions] = useState({
    round_number: 1,
    round_name: 'Technical Round 1',
    start_date: '2026-08-25',
    start_hour: 9,
    slot_duration_minutes: 45,
    buffer_minutes: 15,
    auto_resolve_conflicts: true
  });

  // Conflict Resolution Modal
  const [conflictTarget, setConflictTarget] = useState(null);
  const [newPanelId, setNewPanelId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Evaluation & Feedback Modal
  const [evalTarget, setEvalTarget] = useState(null);
  const [evalStatus, setEvalStatus] = useState('COMPLETED');
  const [evalResult, setEvalResult] = useState('SELECTED');
  const [evalRating, setEvalRating] = useState(8.5);
  const [evalFeedback, setEvalFeedback] = useState('Strong technical depth in DSA and system design.');
  const [evaluating, setEvaluating] = useState(false);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  useEffect(() => {
    if (activeDrive) {
      loadScheduleData(activeDrive.id);
    }
  }, [activeDrive?.id]);

  const loadScheduleData = async (driveId) => {
    try {
      setLoading(true);
      const [schData, pData, rData, loadData] = await Promise.all([
        apiClient.getDriveSchedule(driveId),
        apiClient.getPanels(),
        apiClient.getRooms(),
        apiClient.getPanelLoads()
      ]);
      setSchedules(schData);
      setPanels(pData);
      setRooms(rData);
      setPanelLoads(loadData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async (e) => {
    e.preventDefault();
    if (!activeDrive) return;
    try {
      setGenerating(true);
      await apiClient.generateSchedule(activeDrive.id, genOptions);
      setShowGenModal(false);
      await loadScheduleData(activeDrive.id);
    } catch (err) {
      console.error('Schedule generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleResolveConflict = async (e) => {
    e.preventDefault();
    if (!conflictTarget) return;
    try {
      setResolving(true);
      await apiClient.resolveScheduleConflict({
        schedule_id: conflictTarget.id,
        new_panel_id: newPanelId ? parseInt(newPanelId) : null,
        new_room_id: newRoomId ? parseInt(newRoomId) : null,
        actor_id: 'TPO_ADMIN',
        resolution_notes: resolutionNotes || 'TPO reallocated panel and cleared schedule conflict'
      });
      setConflictTarget(null);
      setResolutionNotes('');
      await loadScheduleData(activeDrive.id);
    } catch (err) {
      console.error('Failed to resolve conflict', err);
    } finally {
      setResolving(false);
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!evalTarget) return;
    try {
      setEvaluating(true);
      await apiClient.updateSlotStatus(
        evalTarget.id,
        evalStatus,
        evalResult,
        evalRating,
        evalFeedback
      );
      setEvalTarget(null);
      await loadScheduleData(activeDrive.id);
    } catch (err) {
      console.error('Failed to record outcome', err);
    } finally {
      setEvaluating(false);
    }
  };

  const conflictCount = schedules.filter(s => s.is_conflict).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              SchedulingAgent & CoordinationAgent
            </span>
            <span className="text-xs text-slate-400 font-mono">Constraint Satisfaction Engine</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Interview Scheduling & Venue Matrix</h1>
          <p className="text-xs text-slate-400">
            Coordinates interview panels, room allocations, virtual links, and avoids time overlaps and double-bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            Generate / Optimize Slots
          </button>

          <button
            onClick={() => onSelectView('notifications')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            Send Call Letters
          </button>
        </div>
      </div>

      {/* Drive Context Banner */}
      {activeDrive && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{activeDrive.company?.name} — {activeDrive.role_title}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-500/20 text-cyan-300">
                  {schedules.length} Slots Scheduled
                </span>
                {conflictCount > 0 && (
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    {conflictCount} Double-Bookings Detected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Scheduled Date: {activeDrive.drive_date || '2026-09-01'} • Stage: {activeDrive.stage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Schedule Timeline Table vs Panel Workload Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Interview Slot Timeline Matrix
              </h2>
              <span className="text-xs text-slate-400 font-mono">Real-time Constraints</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#0E1526] text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-3 px-3">Time Slot</th>
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-3">Interviewer Panel</th>
                    <th className="py-3 px-3">Venue / Link</th>
                    <th className="py-3 px-3 text-right">Result & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                        No interview slots generated yet. Click "Generate / Optimize Slots" to run the Scheduling Agent.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((sch) => {
                      const student = sch.student || {};
                      const panel = sch.panel || {};
                      const room = sch.room || {};

                      return (
                        <tr
                          key={sch.id}
                          className={`transition-colors ${
                            sch.is_conflict
                              ? 'bg-rose-950/20 border-l-2 border-rose-500'
                              : 'hover:bg-slate-850/40'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono text-slate-200">
                            <div className="font-semibold text-[11px]">{sch.start_time.split(' ')[1]} {sch.start_time.split(' ')[2]}</div>
                            <div className="text-[10px] text-slate-400">{sch.start_time.split(' ')[0]}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{student.name || `Candidate #${sch.student_id}`}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{student.roll_number} • {student.branch}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-200">{panel.name || 'Panel TBD'}</div>
                            <div className="text-[10px] text-slate-400">{panel.role_designation || panel.company_name}</div>
                          </td>

                          <td className="py-3 px-3">
                            {room.room_type === 'VIRTUAL_MEET' ? (
                              <a
                                href={sch.meeting_link || room.virtual_link_template}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                              >
                                <Video className="w-3.5 h-3.5" /> Virtual Meet
                              </a>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-300 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                <span>{room.room_number || 'Cabin'}</span>
                              </div>
                            )}
                            <div className="text-[9px] text-slate-500">{room.building_block}</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {sch.is_conflict ? (
                              <div className="inline-flex flex-col items-end gap-1">
                                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> DOUBLE-BOOKED
                                </span>
                                <button
                                  onClick={() => {
                                    setConflictTarget(sch);
                                    setNewPanelId('');
                                    setNewRoomId('');
                                    setResolutionNotes('');
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                                >
                                  Fix Conflict
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                  {sch.result === 'SELECTED' ? (
                                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ★ OFFER ISSUED
                                    </span>
                                  ) : sch.result === 'REJECTED' ? (
                                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      REJECTED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      {sch.status}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEvalTarget(sch);
                                    setEvalResult(sch.result === 'PENDING' ? 'SELECTED' : sch.result);
                                    setEvalRating(sch.interviewer_rating || 8.5);
                                    setEvalFeedback(sch.feedback_notes || 'Demonstrated good problem solving skills.');
                                  }}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                                >
                                  Record Outcome
                                </button>
                              </div>
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
        </div>

        {/* Right Column: Panel Workload Balancer & Venues (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Interviewer Panel Workload
            </h2>

            <div className="space-y-3">
              {panelLoads.map((p) => {
                const pct = Math.min(100, Math.round((p.total_slots_assigned / p.max_slots_per_day) * 100));
                const isOver = p.total_slots_assigned > p.max_slots_per_day;

                return (
                  <div key={p.panel_id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{p.panel_name}</span>
                        <span className="text-[10px] text-slate-400">{p.company_name}</span>
                      </div>
                      <span className={`font-mono font-bold text-[11px] ${isOver ? 'text-rose-400' : 'text-slate-300'}`}>
                        {p.total_slots_assigned} / {p.max_slots_per_day} slots
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : (pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500')
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Schedule Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Configure Scheduling Engine
              </h3>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleGenerateSchedule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Interview Round Name</label>
                <input
                  type="text"
                  value={genOptions.round_name}
                  onChange={(e) => setGenOptions({ ...genOptions, round_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={genOptions.start_date}
                    onChange={(e) => setGenOptions({ ...genOptions, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Start Time (Hour: 24h)</label>
                  <input
                    type="number"
                    min="8"
                    max="18"
                    value={genOptions.start_hour}
                    onChange={(e) => setGenOptions({ ...genOptions, start_hour: parseInt(e.target.value) || 9 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Slot Duration (Mins)</label>
                  <input
                    type="number"
                    value={genOptions.slot_duration_minutes}
                    onChange={(e) => setGenOptions({ ...genOptions, slot_duration_minutes: parseInt(e.target.value) || 45 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Buffer Gap (Mins)</label>
                  <input
                    type="number"
                    value={genOptions.buffer_minutes}
                    onChange={(e) => setGenOptions({ ...genOptions, buffer_minutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
                >
                  {generating ? 'Optimizing Slots...' : 'Run Scheduling Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Resolve Schedule Conflict
              </h3>
              <button onClick={() => setConflictTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              {conflictTarget.conflict_details || 'Double booking detected for this slot.'}
            </p>

            <form onSubmit={handleResolveConflict} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Reassign to Alternative Panel</label>
                <select
                  value={newPanelId}
                  onChange={(e) => setNewPanelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Keep or Auto-Select Standby Panel --</option>
                  {panels.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role_designation}) - Max {p.max_slots_per_day} slots
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Reassign to Alternative Venue Room</label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Keep Current Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} ({r.room_type}) - {r.building_block}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Resolution Notes (Mandatory for Audit Trail)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reassigned candidate to standby panel due to interviewer delay"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConflictTarget(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {resolving ? 'Reallocating...' : 'Apply Reallocation & Clear Conflict'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Outcome & Feedback Modal */}
      {evalTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                Record Interview Outcome & Rating
              </h3>
              <button onClick={() => setEvalTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Candidate</span>
              <span className="font-bold text-white">{evalTarget.student?.name} ({evalTarget.student?.roll_number})</span>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Evaluation Outcome</label>
                  <select
                    value={evalResult}
                    onChange={(e) => setEvalResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold"
                  >
                    <option value="SELECTED">SELECTED (Issue Offer)</option>
                    <option value="CLEARED">CLEARED (Next Round)</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Score / Rating (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={evalRating}
                    onChange={(e) => setEvalRating(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Interviewer Technical & Cultural Feedback</label>
                <textarea
                  rows={3}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Enter detailed interviewer assessment notes..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvalTarget(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {evaluating ? 'Saving...' : 'Confirm Outcome & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
