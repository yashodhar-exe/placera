import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  Search, 
  Filter, 
  User, 
  Clock, 
  FileText,
  RotateCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function AuditTrailView({ onRefreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadAuditLogs();
  }, [onRefreshTrigger]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = !actionFilter || log.action_type === actionFilter;
    const matchesSearch = !searchQuery || 
      log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action) => {
    if (action.includes('OVERRIDE')) {
      return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">{action}</span>;
    }
    if (action.includes('APPROVE') || action.includes('CONFIRM')) {
      return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{action}</span>;
    }
    if (action.includes('RESOLVE')) {
      return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">{action}</span>;
    }
    return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-slate-300">{action}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Immutable Governance Log
            </span>
            <span className="text-xs text-slate-400 font-mono">HITL Decision Integrity</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Human-in-the-Loop Audit Trail</h1>
          <p className="text-xs text-slate-400">
            Immutable log of all human decisions, overrides, parameter modifications, schedule reallocations, and exception resolutions.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trail
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="OVERRIDE_ELIGIBILITY">OVERRIDE_ELIGIBILITY</option>
            <option value="APPROVE_JD">APPROVE_JD</option>
            <option value="SHORTLIST_APPROVE">SHORTLIST_APPROVE</option>
            <option value="STAGE_TRANSITION">STAGE_TRANSITION</option>
            <option value="RESOLVE_EXCEPTION">RESOLVE_EXCEPTION</option>
            <option value="REALLOCATE_INTERVIEW_SLOT">REALLOCATE_INTERVIEW_SLOT</option>
            <option value="DISPATCH_NOTIFICATIONS">DISPATCH_NOTIFICATIONS</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">
          {filteredLogs.length} Immutable Log Entries
        </span>
      </div>

      {/* Audit Entries List */}
      <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic text-xs">
            No audit records found matching your filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className="p-4 hover:bg-slate-850/40 transition-colors space-y-2 text-xs">
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action_type)}
                        <span className="font-mono text-slate-400 text-[11px]">Target: {log.target_type} #{log.target_id || ''}</span>
                        {log.drive_id && (
                          <span className="text-blue-400 font-mono text-[10px]">Drive #{log.drive_id}</span>
                        )}
                      </div>
                      <div className="text-slate-200 font-medium mt-0.5">
                        {log.reason || 'Human authorization confirmed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="text-slate-400 font-mono text-[10px]">
                      <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                      {log.actor_id}
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded State Snapshot View */}
                {isExpanded && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">State Snapshot Before</span>
                      <pre className="p-2 rounded bg-slate-900 text-slate-300 overflow-x-auto text-[10px]">
                        {JSON.stringify(log.before_state, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">State Snapshot After</span>
                      <pre className="p-2 rounded bg-slate-900 text-emerald-300 overflow-x-auto text-[10px]">
                        {JSON.stringify(log.after_state, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
