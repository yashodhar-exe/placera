import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Radio, 
  ChevronDown, 
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function Header({ 
  drives = [], 
  selectedDriveId, 
  onSelectDrive, 
  openExceptionsCount = 0, 
  onRefresh, 
  onOpenExceptions 
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedDrive = drives.find(d => d.id === selectedDriveId);

  return (
    <header className="sticky top-0 z-40 bg-[#0B101D]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Agent Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-white">CAMPUS COMMAND</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  HITL AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">University Placement & Coordination Operations</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              9 Agents Online
            </div>
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Context Router: Synchronized</span>
            </div>
          </div>
        </div>

        {/* Center: Active Drive Context Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-sm shadow-inner">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400 font-medium">Drive Context:</span>
            <select
              value={selectedDriveId || ''}
              onChange={(e) => onSelectDrive(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
            >
              <option value="" className="bg-slate-900 text-slate-200">-- All Active Drives Overview --</option>
              {drives.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                  {d.company?.name || 'Company'} — {d.role_title} ({d.stage})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Telemetry, Exceptions & TPO Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right pr-2">
            <div className="text-xs font-mono font-medium text-slate-200">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] text-slate-400">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <button
            onClick={onRefresh}
            title="Synchronize System State"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Urgent Exception Alert */}
          <button
            onClick={onOpenExceptions}
            className={`relative p-2 rounded-lg transition-all border ${
              openExceptionsCount > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30 glow-urgent'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-700/80'
            }`}
            title="View Exception Radar"
          >
            <AlertTriangle className="w-4 h-4" />
            {openExceptionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                {openExceptionsCount}
              </span>
            )}
          </button>

          {/* TPO Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
              TPO
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                TPO Lead Officer
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-[10px] text-amber-400 font-medium">HITL Sign-off Authority</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
