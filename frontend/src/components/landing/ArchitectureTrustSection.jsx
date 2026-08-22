import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Server, 
  Database, 
  CheckCircle2, 
  Cpu, 
  TrendingUp, 
  Users, 
  Clock, 
  Award,
  Zap,
  Globe
} from 'lucide-react';

export default function ArchitectureTrustSection() {
  const metrics = [
    {
      value: '90%',
      label: 'Reduction in Manual Work',
      subtext: 'Eliminates repetitive spreadsheet shortlisting & timetable drafting'
    },
    {
      value: '0',
      label: 'Scheduling Clashes',
      subtext: 'Mathematically verified across 10,000+ parallel interview slots'
    },
    {
      value: '100%',
      label: 'Audit Trail Compliance',
      subtext: 'Every decision & override is logged for NIRF/NAAC accreditation'
    },
    {
      value: '< 3s',
      label: 'Multi-Channel Alert Dispatch',
      subtext: 'Instant WhatsApp & Email calendar deliveries with read tracking'
    }
  ];

  const securityFeatures = [
    {
      title: 'Zero Data Retention for AI Training',
      description: 'Student resumes, academic records, and institutional data are strictly isolated in your private institutional tenancy and are never used to train public LLM models.',
      icon: Lock
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      description: 'Granular permissions for Placement Directors, TPOs, Department HODs, Student Placement Coordinators, and Corporate Recruiter panels.',
      icon: ShieldCheck
    },
    {
      title: 'Bi-Directional ERP Integrations',
      description: 'Native real-time connectors for SAP Student Lifecycle, Oracle PeopleSoft, Superset, Ellucian Banner, and custom campus SQL databases.',
      icon: Database
    },
    {
      title: 'Private Cloud & VPC Ready',
      description: 'Deploy on AWS, Azure, Google Cloud Dedicated VPC, or air-gapped on-premises campus servers to meet strict institutional data sovereignty mandates.',
      icon: Server
    }
  ];

  return (
    <section id="architecture" className="py-20 md:py-28 bg-slate-50/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Metric Impact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                {m.value}
              </div>
              <div className="mt-2 text-sm font-bold text-slate-800">
                {m.label}
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {m.subtext}
              </p>
            </div>
          ))}
        </div>

        {/* Security & Architecture Header */}
        <div className="mt-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Enterprise Security & Data Sovereignty</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Engineered with Institutional Trust at the Core
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            University data contains sensitive academic and personal information. CampusOps guarantees complete privacy, cryptographic auditability, and zero public model contamination.
          </p>
        </div>

        {/* Security Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {sec.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
