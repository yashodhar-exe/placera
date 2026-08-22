import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does the AI ensure students are not unfairly excluded from campus placement drives?',
      a: 'CampusOps uses a deterministic rule engine for all academic criteria (CGPA, active backlogs, gap years, and branch eligibility) rather than generative or probabilistic guessing. This guarantees zero hallucination. Furthermore, the Training & Placement Officer (TPO) reviews every proposed shortlist before any corporate recruiter or student receives official notifications.'
    },
    {
      q: 'How does the TPO maintain final decision authority over candidate shortlists and schedules?',
      a: 'Through mandatory Human-in-the-Loop (HITL) approval gates. The autonomous agents perform the heavy lifting—parsing the JD, auditing eligibility, computing skill match scores, and resolving calendar timetables—but the workflow is strictly paused until the TPO clicks "Approve" or applies custom overrides.'
    },
    {
      q: 'What happens when a corporate recruiter cancels, arrives late, or changes panel members?',
      a: 'The Real-Time Exception Radar detects panel delays and cancellations immediately. Rather than causing cascading chaos, the scheduling agent calculates optimal real-time rebalancing options (e.g. merging panels, swapping slots, or notifying affected students) and presents 1-click remediation actions to the TPO.'
    },
    {
      q: 'Can we configure unique institutional policies like "Dream vs Super-Dream" offer caps or reservation quotas?',
      a: 'Yes. CampusOps supports custom university placement bylaws, including tier caps (e.g., a student with an 8 LPA offer can only apply for 15+ LPA drives), department-wise interview limits, affirmative action quotas, and backlogs grace policies.'
    },
    {
      q: 'How does CampusOps integrate with our existing college ERP, SAP, or Superset platform?',
      a: 'CampusOps offers native REST APIs, automated CSV/Excel batch synchronizers, and bi-directional connectors for SAP Student Lifecycle, Oracle PeopleSoft, Superset, and custom campus relational databases.'
    },
    {
      q: 'Is student resume and academic data kept confidential and secure?',
      a: 'Absolutely. CampusOps enforces strict institutional tenant isolation. No student resumes, GPA records, or corporate recruiter notes are ever used to train public LLMs or external foundation models. Deployments are available on dedicated private VPCs or on-premises campus servers.'
    }
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Answers for Placement Directors & TPOs
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Everything you need to know about deployment, governance, algorithmic transparency, and institutional control.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isOpen ? 'border-slate-300 bg-slate-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
