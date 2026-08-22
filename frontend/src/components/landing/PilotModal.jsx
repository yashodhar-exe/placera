import React, { useState } from 'react';
import { X, CheckCircle2, Building, Mail, User, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PilotModal({ isOpen, onClose, onLaunchConsole }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    institution: '',
    tpoName: '',
    workEmail: '',
    batchSize: '500-1500',
    currentSystem: 'Superset / ERP'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>Campus Placement Cell Pilot</span>
            </div>

            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Schedule an Institutional Pilot Drive
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Test CampusOps AI during your next campus placement or mock assessment drive. We configure the system with your college bylaws in 48 hours.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  College / University Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. National Institute of Technology / BITS"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Placement Officer / Dean Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={formData.tpoName}
                    onChange={(e) => setFormData({ ...formData, tpoName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Institutional Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="tpo@university.edu"
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Graduating Cohort Size
                  </label>
                  <select
                    value={formData.batchSize}
                    onChange={(e) => setFormData({ ...formData, batchSize: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 outline-none bg-white"
                  >
                    <option>Under 500 Students</option>
                    <option>500 - 1,500 Students</option>
                    <option>1,500 - 4,000 Students</option>
                    <option>4,000+ Students (Multi-Campus)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Platform
                  </label>
                  <select
                    value={formData.currentSystem}
                    onChange={(e) => setFormData({ ...formData, currentSystem: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 outline-none bg-white"
                  >
                    <option>Manual Spreadsheets / Excel</option>
                    <option>Superset / College ERP</option>
                    <option>SAP / PeopleSoft</option>
                    <option>Custom In-House Portal</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Request Institutional Pilot Access</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>NDA & FERPA-Compliant Institutional Agreement</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Pilot Request Confirmed
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{formData.tpoName || 'TPO'}</span>. Our institutional deployment team has received your request for <span className="font-semibold text-slate-900">{formData.institution || 'your institution'}</span>.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900">Next Steps:</div>
              <div>1. Dedicated onboarding engineer assigned to assist your placement team.</div>
              <div>2. Mock drive trial environment provisioned with sample student profiles.</div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onLaunchConsole();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                Launch Sandbox Console Now
              </button>
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
