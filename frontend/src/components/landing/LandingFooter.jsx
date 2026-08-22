import React from 'react';
import { Layers, ArrowRight, ShieldCheck, CheckCircle2, Heart } from 'lucide-react';

export default function LandingFooter({ onLaunchConsole, onOpenPilotModal }) {
  return (
    <footer className="bg-white border-t border-slate-200 py-16 text-slate-600 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-200">
          
          {/* Brand & Mission (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-slate-900">
                CampusOps <span className="text-blue-600 font-mono text-xs">AI</span>
              </span>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm">
              The autonomous AI coordination platform built for high-stakes university placement operations. AI coordinates repetitive logistics while humans retain authoritative control.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-[11px]">System Status: All 8 Agent Engines Operational (100%)</span>
            </div>
          </div>

          {/* Platform Links (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              <li><a href="#workflow" className="hover:text-slate-900 transition-colors">8-Stage Workflow</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Agent Capabilities</a></li>
              <li><a href="#hitl" className="hover:text-slate-900 transition-colors font-medium text-slate-900">Human-in-the-Loop</a></li>
              <li><a href="#sandbox" className="hover:text-slate-900 transition-colors">Interactive Sandbox</a></li>
              <li><a href="#architecture" className="hover:text-slate-900 transition-colors">Security & Trust</a></li>
              <li><a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Institutional (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider">
              Governance
            </div>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-500">FERPA Compliance</span></li>
              <li><span className="text-slate-500">Zero AI Training on Resumes</span></li>
              <li><span className="text-slate-500">NAAC / NIRF Audit Trail</span></li>
              <li><span className="text-slate-500">Private Cloud & On-Prem VPC</span></li>
              <li><span className="text-slate-500">Role-Based Access Control</span></li>
            </ul>
          </div>

          {/* Quick Actions (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider">
              Placement Cell Access
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Experience the live placement management command center.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={onLaunchConsole}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch Live TPO Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onOpenPilotModal}
                className="w-full py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Schedule Institutional Pilot
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} CampusOps AI Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px] font-mono text-slate-400">
            <span>Deterministic AI Architecture</span>
            <span>•</span>
            <span>Human-Sovereign Governance</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
