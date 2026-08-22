import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  RotateCw, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Wrench, 
  Check, 
  Clock, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function ExceptionRadarView({ onRefreshTrigger }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('OPEN'); // OPEN, RESOLVED, ALL
  const [severityFilter, setSeverityFilter] = useState('');

  // Resolve Modal
  const [selectedException, setSelectedException] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadExceptions();
  }, [onRefreshTrigger]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getExceptions(
        statusFilter === 'ALL' ? undefined : statusFilter,
        severityFilter || undefined
      );
      setExceptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanNow = async () => {
    try {
      setScanning(true);
      await apiClient.scanExceptions();
      await loadExceptions();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedException) return;
    try {
      setResolving(true);
      await apiClient.resolveException(
        selectedException.id,
        resolutionNotes || selectedException.suggested_resolution || 'TPO resolved anomaly',
        'APPLY_SUGGESTED_FIX'
      );
      setSelectedException(null);
      setResolutionNotes('');
      await loadExceptions();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const openCount = exceptions.filter(e => e.status === 'OPEN').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              ExceptionAgent Sentinel
            </span>
            <span className="text-xs text-slate-400 font-mono">Autonomous Conflict & Anomaly Radar</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Exception Action Radar</h1>
          <p className="text-xs text-slate-400">
            Continuously monitors placement operations for double-bookings, schedule clashes, data missing, and matching anomalies.
          </p>
        </div>

        <button
          onClick={handleScanNow}
          disabled={scanning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning Operations...' : 'Run Autonomous Sentinel Scan'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {['OPEN', 'RESOLVED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  // Refresh on change
                  setTimeout(loadExceptions, 50);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'OPEN' ? `Open Alerts (${openCount})` : st}
              </button>
            ))}
          </div>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setTimeout(loadExceptions, 50);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">
          {exceptions.length} Anomaly Tickets Recorded
        </span>
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {exceptions.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">All Clear! No Active Exceptions</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The placement pipeline is running with zero detected scheduling conflicts, double-bookings, or candidate data anomalies.
            </p>
          </div>
        ) : (
          exceptions.map((exc) => (
            <div
              key={exc.id}
              className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 ${
                exc.status === 'OPEN'
                  ? exc.severity === 'HIGH' || exc.severity === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800/60 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    exc.status === 'OPEN' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {exc.status === 'OPEN' ? <AlertOctagon className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        exc.severity === 'HIGH' || exc.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {exc.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{exc.category}</span>
                      {exc.drive_id && (
                        <span className="text-[10px] font-mono text-blue-400">Drive #{exc.drive_id}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{exc.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(exc.created_at).toLocaleString()}
                  </span>

                  {exc.status === 'OPEN' && (
                    <button
                      onClick={() => {
                        setSelectedException(exc);
                        setResolutionNotes(exc.suggested_resolution || '');
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Resolve Anomaly
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-12">
                {exc.description}
              </p>

              {/* AI Suggested Resolution */}
              <div className="ml-12 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" /> AI Suggested Fix:
                </span>
                <p className="text-slate-200 text-[11px]">{exc.suggested_resolution}</p>
              </div>

              {/* Resolved Note (if any) */}
              {exc.status === 'RESOLVED' && (
                <div className="ml-12 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-xs">
                  <span className="font-bold text-emerald-400">Resolved by {exc.resolved_by || 'TPO'}:</span>
                  <p className="text-emerald-200/90">{exc.resolution_notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleResolve} className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-400" />
                Resolve Placement Exception
              </h3>
              <button
                type="button"
                onClick={() => setSelectedException(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 space-y-1 text-xs">
              <div className="font-bold text-white">{selectedException.title}</div>
              <p className="text-slate-400">{selectedException.description}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-200">
                Action Taken & Resolution Notes (Recorded to Audit Trail) *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe fix applied..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedException(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolving || !resolutionNotes.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {resolving ? 'Applying...' : 'Confirm Resolution & Close Alert'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
