import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Radio, 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function ContextRouterDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getLiveEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 right-6 z-30 w-96 max-w-[calc(100vw-3rem)]">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/95 border-t border-x border-slate-700/80 rounded-t-xl text-xs font-semibold text-slate-200 shadow-2xl backdrop-blur-md hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-blue-400">Context Router Stream</span>
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            <Radio className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{events.length} events</span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Stream Content */}
      {isOpen && (
        <div className="bg-[#0A0E1A]/95 border-x border-b border-slate-800 p-3 max-h-80 overflow-y-auto space-y-2 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span>Agent Orchestration Feed</span>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            {events.length === 0 ? (
              <p className="text-slate-500 italic text-center py-4">Awaiting agent execution events...</p>
            ) : (
              events.map((evt, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-400">{evt.agent_name}</span>
                    <span className="text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-tight font-sans">{evt.message}</div>
                  <div className="text-[9px] text-slate-500 truncate">
                    Type: <span className="text-slate-400">{evt.event_type}</span> {evt.drive_id ? `| Drive #${evt.drive_id}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
