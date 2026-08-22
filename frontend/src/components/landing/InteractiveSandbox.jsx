import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Sparkles, 
  Calendar, 
  Sliders, 
  Play, 
  RotateCcw, 
  Check, 
  Layers, 
  Terminal, 
  Cpu, 
  ArrowRight,
  ChevronRight,
  Filter,
  Users,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState('jd-parser');

  // Tab 1 State: JD Parser
  const sampleJDs = [
    {
      company: 'Amazon AWS',
      role: 'Cloud Support & Systems Engineer',
      ctc: '28.5 LPA',
      minCgpa: 7.5,
      branches: ['CSE', 'ECE', 'IT', 'AI&DS'],
      skills: ['Distributed Systems', 'Linux/Unix', 'Networking', 'Python/Go'],
      rounds: ['Online Assessment', 'Tech Round 1', 'Tech Round 2', 'Bar Raiser']
    },
    {
      company: 'Goldman Sachs',
      role: 'Quantitative & Core SDE Analyst',
      ctc: '34.0 LPA',
      minCgpa: 8.0,
      branches: ['CSE', 'ECE', 'Math & Computing'],
      skills: ['C++', 'Data Structures & Algorithms', 'Stochastic Calculus', 'PostgreSQL'],
      rounds: ['Aptitude & Math Screen', 'Coding Round', 'System Architecture', 'MD Round']
    },
    {
      company: 'Microsoft',
      role: 'Software Development Engineer 2026',
      ctc: '42.0 LPA',
      minCgpa: 8.2,
      branches: ['CSE', 'IT', 'ECE'],
      skills: ['Azure Services', 'C# / Java', 'System Design', 'Algorithms'],
      rounds: ['Online Code Assessment', 'Round 1 Algorithms', 'Round 2 Design', 'AA Round']
    }
  ];
  const [selectedJdIdx, setSelectedJdIdx] = useState(0);

  // Tab 2 State: Eligibility Simulator
  const [cgpaFilter, setCgpaFilter] = useState(7.5);
  const [allowBacklog, setAllowBacklog] = useState(false);
  const [targetBranchOnly, setTargetBranchOnly] = useState(true);

  const studentPool = [
    { id: 'STU-101', name: 'Aarav Patel', branch: 'CSE', cgpa: 9.1, backlogs: 0, yearGap: 0 },
    { id: 'STU-102', name: 'Bhavna Sen', branch: 'ECE', cgpa: 8.4, backlogs: 0, yearGap: 0 },
    { id: 'STU-103', name: 'Chirag Reddy', branch: 'IT', cgpa: 7.8, backlogs: 0, yearGap: 0 },
    { id: 'STU-104', name: 'Divya Iyer', branch: 'MECH', cgpa: 8.6, backlogs: 0, yearGap: 0 },
    { id: 'STU-105', name: 'Eshan Roy', branch: 'CSE', cgpa: 7.4, backlogs: 0, yearGap: 0 },
    { id: 'STU-106', name: 'Farhan Zaidi', branch: 'ECE', cgpa: 8.1, backlogs: 1, yearGap: 0 },
    { id: 'STU-107', name: 'Geeta Menon', branch: 'CSE', cgpa: 8.9, backlogs: 0, yearGap: 1 },
    { id: 'STU-108', name: 'Harsh Vardhan', branch: 'IT', cgpa: 7.1, backlogs: 0, yearGap: 0 }
  ];

  const evaluatedStudents = studentPool.map(stu => {
    const cgpaOk = stu.cgpa >= cgpaFilter;
    const backlogOk = allowBacklog ? true : stu.backlogs === 0;
    const branchOk = targetBranchOnly ? ['CSE', 'ECE', 'IT'].includes(stu.branch) : true;
    const passed = cgpaOk && backlogOk && branchOk;
    let reason = 'Meets all criteria';
    if (!cgpaOk) reason = `CGPA (${stu.cgpa}) < Cutoff (${cgpaFilter})`;
    else if (!backlogOk) reason = `Active Backlog (${stu.backlogs})`;
    else if (!branchOk) reason = `Branch (${stu.branch}) not in target set`;

    return { ...stu, passed, reason };
  });

  const eligibleCount = evaluatedStudents.filter(s => s.passed).length;

  // Tab 3 State: Skill Match Inspector
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const matchCandidates = [
    {
      name: 'Aditya Kulkarni',
      branch: 'CSE · 2026',
      cgpa: 9.32,
      matchScore: 96,
      skillsBreakdown: [
        { label: 'Data Structures & Algorithms', score: 98 },
        { label: 'Distributed Systems & Go', score: 95 },
        { label: 'Cloud Architecture & Docker', score: 92 },
        { label: 'Database Design & SQL', score: 94 },
      ],
      aiRationale: 'Strong candidate with verified open-source contributions in distributed consensus (Raft). Highest score in concurrency and algorithmic rounds.'
    },
    {
      name: 'Meera Nambiar',
      branch: 'ECE · 2026',
      cgpa: 8.85,
      matchScore: 91,
      skillsBreakdown: [
        { label: 'C++ & Low-Level Systems', score: 96 },
        { label: 'Computer Vision & CUDA', score: 94 },
        { label: 'Algorithms & LeetCode (Top 5%)', score: 88 },
        { label: 'Embedded Microcontrollers', score: 92 },
      ],
      aiRationale: 'Exceptional profile for high-performance compute and graphics acceleration tracks. Won 1st place in National Autonomous Robotics Challenge.'
    },
    {
      name: 'Sahil Deshpande',
      branch: 'IT · 2026',
      cgpa: 8.40,
      matchScore: 87,
      skillsBreakdown: [
        { label: 'Full-Stack & TypeScript', score: 92 },
        { label: 'PostgreSQL & Redis Caching', score: 90 },
        { label: 'System Design & APIs', score: 85 },
        { label: 'Algorithms & Problem Solving', score: 82 },
      ],
      aiRationale: 'Solid full-stack engineering portfolio with 3 deployed microservice web apps. Recommended for product infrastructure team.'
    }
  ];

  // Tab 4 State: Slot Scheduler Matrix
  const [scheduleGenerated, setScheduleGenerated] = useState(true);

  return (
    <section id="sandbox" className="py-20 md:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hands-On Interactive Sandbox</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Test the AI Coordination Engines Live
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Interact with real simulation modules below to see how CampusOps handles JD parsing, deterministic eligibility, explainable scoring, and conflict-free schedules.
          </p>
        </div>

        {/* Sandbox Tabs */}
        <div className="mt-10 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('jd-parser')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'jd-parser'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. JD Parser & Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('eligibility-auditor')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'eligibility-auditor'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>2. Eligibility Auditor</span>
          </button>

          <button
            onClick={() => setActiveTab('skill-matcher')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'skill-matcher'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>3. Explainable Matcher</span>
          </button>

          <button
            onClick={() => setActiveTab('slot-scheduler')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'slot-scheduler'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>4. Conflict-Free Scheduler</span>
          </button>
        </div>

        {/* Sandbox Content Area */}
        <div className="mt-8 max-w-4xl mx-auto bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: JD Parser */}
          {activeTab === 'jd-parser' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Real-Time JD Structuring Engine
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select a recruiter JD to see the NLP agent extract structured rules and CTC tiers.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {sampleJDs.map((jd, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedJdIdx(idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        selectedJdIdx === idx
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {jd.company}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted Structured Schema Viewer */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
                  <div>
                    <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">Target Role & CTC</span>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{sampleJDs[selectedJdIdx].role}</div>
                    <div className="text-sm font-mono font-bold text-blue-600 mt-0.5">{sampleJDs[selectedJdIdx].ctc}</div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">Eligibility Filters</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        Min CGPA: {sampleJDs[selectedJdIdx].minCgpa}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Max Backlogs: 0
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sampleJDs[selectedJdIdx].branches.map((b, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
                  <div>
                    <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">Extracted Skill Matrix</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {sampleJDs[selectedJdIdx].skills.map((skill, i) => (
                        <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">Extracted Interview Rounds</span>
                    <div className="space-y-1 mt-1.5">
                      {sampleJDs[selectedJdIdx].rounds.map((round, i) => (
                        <div key={i} className="text-xs flex items-center gap-2 text-slate-700">
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[9px] flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span>{round}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Eligibility Auditor */}
          {activeTab === 'eligibility-auditor' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Deterministic Zero-Hallucination Filter
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Adjust criteria to test mathematical verification across academic student records.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {eligibleCount} / {studentPool.length} Eligible
                </div>
              </div>

              {/* Controls */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>CGPA Cutoff:</span>
                    <span className="font-mono text-blue-600 font-bold">{cgpaFilter.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="6.5"
                    max="9.0"
                    step="0.1"
                    value={cgpaFilter}
                    onChange={(e) => setCgpaFilter(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    id="backlogToggle"
                    checked={allowBacklog}
                    onChange={(e) => setAllowBacklog(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <label htmlFor="backlogToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Allow 1 Active Backlog
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    id="branchToggle"
                    checked={targetBranchOnly}
                    onChange={(e) => setTargetBranchOnly(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <label htmlFor="branchToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Restrict to CSE / ECE / IT
                  </label>
                </div>
              </div>

              {/* Candidate Filter Table */}
              <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                {evaluatedStudents.map((stu) => (
                  <div key={stu.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        stu.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {stu.passed ? '✓' : '✕'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">{stu.name}</span>
                        <span className="text-slate-500 ml-2">
                          ({stu.branch} · {stu.cgpa} CGPA · {stu.backlogs} Backlogs)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        stu.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {stu.passed ? 'ELIGIBLE' : stu.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Explainable Matcher */}
          {activeTab === 'skill-matcher' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Explainable Candidate Match Inspector
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select a candidate to view the deep evidence trail and breakdown scoring.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {matchCandidates.map((cand, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        selectedCandidateIndex === idx
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cand.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Candidate Deep-Dive */}
              {(() => {
                const cand = matchCandidates[selectedCandidateIndex];
                return (
                  <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900 text-base">{cand.name}</div>
                        <div className="text-xs text-slate-500">{cand.branch} · {cand.cgpa} CGPA</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-blue-600">{cand.matchScore}%</div>
                        <div className="text-[10px] text-slate-400 font-mono">Overall Match Score</div>
                      </div>
                    </div>

                    {/* Skill Confidence Bars */}
                    <div className="space-y-2.5">
                      {cand.skillsBreakdown.map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                            <span>{item.label}</span>
                            <span className="font-mono text-slate-900 font-bold">{item.score}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Natural Language Rationale */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI Semantic Match Rationale:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        "{cand.aiRationale}"
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: Slot Scheduler Matrix */}
          {activeTab === 'slot-scheduler' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Conflict-Free Dynamic Scheduler
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Solves multi-panel timetable allocations with 0 student overlaps in &lt; 300ms.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Status: 0 Clashes Detected
                </div>
              </div>

              {/* Dynamic Matrix View */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Panel 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Panel A · DSA Track</span>
                    <span className="text-[10px] font-mono text-slate-500">Lab 101</span>
                  </div>
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-blue-50/70 border border-blue-200 text-slate-800">
                      <div className="font-semibold text-blue-900">09:00 - 09:45 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Ananya Sharma</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">09:55 - 10:40 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Rohan Deshmukh</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">10:50 - 11:35 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Priya Sundaram</div>
                    </div>
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Panel B · Systems Track</span>
                    <span className="text-[10px] font-mono text-slate-500">Lab 102</span>
                  </div>
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">09:00 - 09:45 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Kabir Mehta</div>
                    </div>
                    <div className="p-2 rounded bg-blue-50/70 border border-blue-200 text-slate-800">
                      <div className="font-semibold text-blue-900">09:55 - 10:40 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Ananya Sharma (R2)</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">10:50 - 11:35 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Tanvi Agarwal</div>
                    </div>
                  </div>
                </div>

                {/* Panel 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Panel C · Bar Raiser</span>
                    <span className="text-[10px] font-mono text-slate-500">Lab 103</span>
                  </div>
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">10:00 - 10:45 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Sneha Patel</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <div className="font-semibold text-slate-900">10:55 - 11:40 AM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Arjun Menon</div>
                    </div>
                    <div className="p-2 rounded bg-blue-50/70 border border-blue-200 text-slate-800">
                      <div className="font-semibold text-blue-900">11:50 - 12:35 PM</div>
                      <div className="text-[11px] text-slate-600">Candidate: Ananya Sharma (Final)</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
