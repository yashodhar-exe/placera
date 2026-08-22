import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ArrowRight, 
  Sliders, 
  FileCheck,
  Zap,
  Plus,
  Trash2,
  FileType
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function JDIntakeView({ 
  selectedDriveId, 
  onDriveCreatedOrUpdated, 
  onSelectView 
}) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    ctc_lpa: 12.0,
    base_salary_lpa: 10.0,
    openings: 5,
    job_location: 'Bangalore / Hyderabad / Hybrid',
    tier: 'TIER_1',
    min_cgpa: 7.0,
    min_tenth_pct: 60.0,
    min_twelfth_pct: 60.0,
    allowed_branches: ['CSE', 'IT', 'ECE'],
    max_active_backlogs: 0,
    allow_history_backlogs: true,
    required_skills: ['Data Structures & Algorithms', 'Python', 'System Design & Distributed Systems'],
    preferred_skills: ['Docker & Containerization', 'SQL & Query Optimization', 'FastAPI & RESTful APIs'],
    rounds_config: [
      { round_num: 1, name: 'Online Assessment (Coding & Aptitude)', type: 'TEST', duration_mins: 90 },
      { round_num: 2, name: 'Technical Interview 1 (DSA & Core)', type: 'INTERVIEW', duration_mins: 45 },
      { round_num: 3, name: 'Technical Interview 2 (System & Projects)', type: 'INTERVIEW', duration_mins: 45 },
      { round_num: 4, name: 'HR & Culture Fitment', type: 'HR', duration_mins: 30 }
    ],
    drive_date: '2026-09-05',
    tpo_confirm: true,
    tpo_notes: 'Verified eligibility criteria with company recruiting team'
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');

  // Sample Presets for quick demonstration
  const presets = [
    {
      name: "Apple - Core ML & Systems",
      text: "Hiring Company: Apple Inc.\nPosition: iOS & Core ML Software Engineer\nPackage: 26.5 LPA (Base: 22 LPA)\nOpenings: 4\nLocation: Hyderabad\nMin CGPA: 8.2\nEligible Branches: CSE, IT, ECE\nNo active backlogs allowed. Standing backlogs must be cleared.\nRequirements: Swift, Python, Machine Learning & LLMs, Data Structures & Algorithms, System Design & Distributed Systems, Concurrency\nPreferred: PyTorch, Docker & Containerization, CoreML optimization\nInterview Rounds: Round 1 Online Coding (90m), Round 2 Deep DSA (45m), Round 3 Machine Learning Systems (45m), Round 4 Engineering Leadership (30m)"
    },
    {
      name: "NVIDIA - GPU Systems & CUDA",
      text: "Hiring Company: NVIDIA\nPosition: GPU Systems & Embedded Software Trainee\nPackage: 25.0 LPA\nOpenings: 6\nMin CGPA: 8.0\nEligible Branches: CSE, ECE, EEE\nActive backlogs: 0\nRequirements: C++, Data Structures & Algorithms, Operating Systems & Linux, Computer Networks\nPreferred: CUDA, Parallel Programming, Embedded C / VLSI Design\nInterview Rounds: Coding Assessment, Technical Round 1 Architecture, Technical Round 2 Systems, HR Fitment"
    },
    {
      name: "Uber - Distributed Backend",
      text: "Hiring Company: Uber Technologies\nPosition: Software Engineer - Platform Engineering\nPackage: 27.0 LPA\nOpenings: 5\nLocation: Bangalore\nMin CGPA: 8.0\nBranches: CSE, IT\nRequirements: Java & Spring Boot, System Design & Distributed Systems, SQL & Query Optimization, Data Structures & Algorithms\nPreferred: Kafka, Redis, Kubernetes & Orchestration, Docker & Containerization"
    }
  ];

  // If a drive is selected from global context, load its info
  useEffect(() => {
    if (selectedDriveId) {
      loadDriveDetails(selectedDriveId);
    }
  }, [selectedDriveId]);

  const loadDriveDetails = async (id) => {
    try {
      const drive = await apiClient.getDriveById(id);
      setFormData({
        company_name: drive.company?.name || '',
        role_title: drive.role_title || '',
        ctc_lpa: drive.ctc_lpa || 10.0,
        base_salary_lpa: drive.base_salary_lpa || round(drive.ctc_lpa * 0.85, 2),
        openings: drive.openings || 5,
        job_location: drive.job_location || 'Bangalore',
        tier: drive.tier || 'TIER_1',
        min_cgpa: drive.min_cgpa || 7.0,
        min_tenth_pct: drive.min_tenth_pct || 60.0,
        min_twelfth_pct: drive.min_twelfth_pct || 60.0,
        allowed_branches: drive.allowed_branches || ['CSE', 'IT'],
        max_active_backlogs: drive.max_active_backlogs || 0,
        allow_history_backlogs: drive.allow_history_backlogs ?? true,
        required_skills: drive.required_skills || [],
        preferred_skills: drive.preferred_skills || [],
        rounds_config: drive.rounds_config || [],
        drive_date: drive.drive_date || '2026-09-01',
        tpo_confirm: true,
        tpo_notes: 'Loaded from existing drive profile'
      });
      if (drive.job_description_raw) {
        setRawText(drive.job_description_raw);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPreset = (preset) => {
    setRawText(preset.text);
    setUploadedFileName(null);
    handleParseJD(preset.text);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    try {
      setIsParsing(true);
      const fd = new FormData();
      fd.append('file', file);
      const parsed = await apiClient.uploadJDFile(fd);
      setExtractedData(parsed);
      if (parsed.raw_text) {
        setRawText(parsed.raw_text);
      }

      setFormData(prev => ({
        ...prev,
        company_name: parsed.company_name,
        role_title: parsed.role_title,
        ctc_lpa: parsed.ctc_lpa,
        base_salary_lpa: parsed.base_salary_lpa,
        openings: parsed.openings,
        tier: parsed.tier,
        min_cgpa: parsed.min_cgpa,
        allowed_branches: parsed.allowed_branches,
        max_active_backlogs: parsed.max_active_backlogs,
        allow_history_backlogs: parsed.allow_history_backlogs,
        required_skills: parsed.required_skills,
        preferred_skills: parsed.preferred_skills,
        rounds_config: parsed.rounds_config
      }));
    } catch (err) {
      console.error('Failed to parse uploaded JD', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseJD = async (textToParse = rawText) => {
    if (!textToParse.trim()) return;
    try {
      setIsParsing(true);
      const parsed = await apiClient.parseJD({ raw_text: textToParse });
      setExtractedData(parsed);

      setFormData(prev => ({
        ...prev,
        company_name: parsed.company_name,
        role_title: parsed.role_title,
        ctc_lpa: parsed.ctc_lpa,
        base_salary_lpa: parsed.base_salary_lpa,
        openings: parsed.openings,
        tier: parsed.tier,
        min_cgpa: parsed.min_cgpa,
        allowed_branches: parsed.allowed_branches,
        max_active_backlogs: parsed.max_active_backlogs,
        allow_history_backlogs: parsed.allow_history_backlogs,
        required_skills: parsed.required_skills,
        preferred_skills: parsed.preferred_skills,
        rounds_config: parsed.rounds_config
      }));
    } catch (err) {
      console.error('JD Parsing failed', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleBranch = (branch) => {
    setFormData(prev => {
      const current = prev.allowed_branches || [];
      if (current.includes(branch)) {
        return { ...prev, allowed_branches: current.filter(b => b !== branch) };
      } else {
        return { ...prev, allowed_branches: [...current, branch] };
      }
    });
  };

  const handleAddReqSkill = () => {
    if (newReqSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newReqSkill.trim()]
      }));
      setNewReqSkill('');
    }
  };

  const handleRemoveReqSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }));
  };

  const handleAddPrefSkill = () => {
    if (newPrefSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        preferred_skills: [...prev.preferred_skills, newPrefSkill.trim()]
      }));
      setNewPrefSkill('');
    }
  };

  const handleRemovePrefSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      preferred_skills: prev.preferred_skills.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.createDrive(formData);
      setSuccessMsg(`Placement Drive ${res.drive_code} successfully created & verified by TPO!`);
      
      if (onDriveCreatedOrUpdated) {
        onDriveCreatedOrUpdated(res.id);
      }

      // Auto-trigger eligibility evaluation for the new drive
      await apiClient.evaluateEligibility(res.id);

      setTimeout(() => {
        onSelectView('eligibility');
      }, 1200);
    } catch (err) {
      console.error('Failed to create drive', err);
    } finally {
      setSaving(false);
    }
  };

  const availableBranches = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "CSBS"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              JDIntakeAgent v2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Multi-Format Intake & Extraction</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white mt-1">Job Description Intake & AI Extraction</h1>
          <p className="text-xs text-slate-400">
            Upload PDF, text files, or paste raw descriptions. AI extracts key hiring parameters and TPO verifies criteria.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Raw JD Input & Extraction Preview vs Editable TPO Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Raw Intake & Extraction Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Raw Job Description (PDF / Text)
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Multi-Format</span>
            </div>

            {/* File Upload Zone */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-900/50 hover:bg-slate-850/60 transition-colors text-center space-y-2 relative">
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-indigo-400 mx-auto" />
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Upload PDF or Text JD File'}
                </span>
                <p className="text-[10px] text-slate-500">Drag & drop or click to browse (PDF / TXT)</p>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400">Quick Test Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw JD, email text, or campus drive brochure here..."
              className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleParseJD()}
                disabled={isParsing || !rawText.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
                {isParsing ? 'Extracting Parameters...' : 'Extract with JD Intake Agent'}
              </button>
            </div>
          </div>

          {/* AI Extraction Confidence Telemetry */}
          {extractedData && (
            <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Agent Extraction Telemetry
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  {(extractedData.confidence_score * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Company Name</span>
                  <span className="font-semibold text-slate-200">{extractedData.company_name}</span>
                  <span className="text-[9px] text-emerald-400 block">97% confidence</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Package</span>
                  <span className="font-semibold text-emerald-400">{extractedData.ctc_lpa} LPA</span>
                  <span className="text-[9px] text-emerald-400 block">96% confidence</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Min CGPA Cutoff</span>
                  <span className="font-semibold text-slate-200">{extractedData.min_cgpa}</span>
                  <span className="text-[9px] text-emerald-400 block">98% confidence</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Identified Branches</span>
                  <span className="font-semibold text-slate-200">{extractedData.allowed_branches?.join(', ')}</span>
                  <span className="text-[9px] text-emerald-400 block">95% confidence</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: TPO Review & Confirmation Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  TPO Review & Confirmation Workspace
                </h2>
                <p className="text-xs text-slate-400">Review AI extracted parameters and adjust before approving drive criteria</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                HITL Gate
              </span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Google, Microsoft, Apple"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Job Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={formData.role_title}
                  onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Total Package (CTC in LPA) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.ctc_lpa}
                  onChange={(e) => {
                    const ctc = parseFloat(e.target.value) || 0;
                    const tier = ctc >= 15.0 ? 'DREAM' : (ctc >= 8.0 ? 'TIER_1' : 'TIER_2');
                    setFormData({ ...formData, ctc_lpa: ctc, tier, base_salary_lpa: round(ctc * 0.85, 2) });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">University Placement Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="DREAM">DREAM (CTC &gt;= 15 LPA)</option>
                  <option value="TIER_1">TIER 1 (CTC 8 - 14.9 LPA)</option>
                  <option value="TIER_2">TIER 2 (CTC &lt; 8 LPA)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Total Openings</label>
                <input
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Scheduled Drive Date</label>
                <input
                  type="date"
                  value={formData.drive_date}
                  onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Eligibility Filters */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Eligibility Filter Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Min CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Max Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.max_active_backlogs}
                    onChange={(e) => setFormData({ ...formData, max_active_backlogs: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Standing Backlog History</label>
                  <select
                    value={formData.allow_history_backlogs ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, allow_history_backlogs: e.target.value === 'true' })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="true">Permit Cleared Backlogs</option>
                    <option value="false">Mandate Zero History</option>
                  </select>
                </div>
              </div>

              {/* Branch Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Eligible Branches:</label>
                <div className="flex flex-wrap gap-2">
                  {availableBranches.map((b) => {
                    const isSelected = formData.allowed_branches?.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleBranch(b)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border border-blue-400'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Skills Taxonomy Tags */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Required & Preferred Technical Skills
              </h3>

              {/* Required Skills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Core Required Skills (High Weight in AI Matching)</label>
                <div className="flex flex-wrap gap-1.5">
                  {formData.required_skills.map((sk, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-medium">
                      {sk}
                      <button type="button" onClick={() => handleRemoveReqSkill(idx)} className="hover:text-rose-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add required skill (e.g. System Design, PyTorch)..."
                    value={newReqSkill}
                    onChange={(e) => setNewReqSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReqSkill(); }}}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddReqSkill}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300">Preferred / Bonus Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {formData.preferred_skills.map((sk, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-medium">
                      {sk}
                      <button type="button" onClick={() => handleRemovePrefSkill(idx)} className="hover:text-rose-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add preferred skill (e.g. Docker, Redis)..."
                    value={newPrefSkill}
                    onChange={(e) => setNewPrefSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrefSkill(); }}}
                    className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrefSkill}
                    className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* TPO Sign-off Audit Note */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">TPO Verification & Audit Sign-off Note</label>
              <input
                type="text"
                value={formData.tpo_notes}
                onChange={(e) => setFormData({ ...formData, tpo_notes: e.target.value })}
                placeholder="e.g. Approved criteria as communicated by company talent acquisition lead"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
              />
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Saving transitions drive to <span className="text-emerald-400 font-mono">ELIGIBILITY_PROCESSED</span>
              </span>

              <button
                type="submit"
                disabled={saving || !formData.company_name || !formData.role_title}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Processing...' : 'Approve & Run Eligibility Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function round(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}
