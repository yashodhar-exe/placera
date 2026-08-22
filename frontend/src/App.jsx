import { useState, useEffect } from 'react'
import Auth from './Auth'
import './index.css'
import { dotPulse } from 'ldrs'

dotPulse.register()

const API_BASE = "http://localhost:8000/api"

function TPODashboard({ user, logout }) {
  const [driveId, setDriveId] = useState(null)
  const [step, setStep] = useState(0)
  const [jdText, setJdText] = useState("Looking for a Software Engineer with Python and React skills. CGPA > 7.5. Open to CSE and ECE branches.")
  const [parsedJd, setParsedJd] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [matches, setMatches] = useState([])
  const [schedule, setSchedule] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [agentEvents, setAgentEvents] = useState([])
  const [summary, setSummary] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [negotiation, setNegotiation] = useState(null)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'drives'

  const [drives, setDrives] = useState([])
  const [companies, setCompanies] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [applications, setApplications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  const currentDrive = drives.find(d => d.id === driveId)

  useEffect(() => {
    fetchSummary()
    fetchEvents()
    fetchAuditLog()
    
    fetch(`${API_BASE}/companies`)
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error("Error fetching companies:", err))

    fetchApplications()

    if (!driveId) {
      fetch(`${API_BASE}/drives`)
        .then(res => res.json())
        .then(data => setDrives(data))
        .catch(err => console.error("Error fetching drives:", err))
    }
  }, [driveId])

  const resumeDrive = (drive) => {
    setDriveId(drive.id)
    switch (drive.status) {
      case 'DRAFT': setStep(1); break;
      case 'JD_PARSED': setStep(3); break;
      case 'ELIGIBILITY_DONE': setStep(4); break;
      case 'MATCHING_DONE': setStep(5); break;
      case 'SCHEDULED': setStep(6); break;
      case 'COMPLETED': setStep(7); break;
      default: setStep(1); break;
    }
    fetchEvents()
  }

  const handleBackToDrives = () => {
    setDriveId(null)
    setStep(0)
    setCurrentView('dashboard')
  }

  const fetchApplications = async () => {
    const res = await fetch(`${API_BASE}/applications`)
    if (res.ok) {
      setApplications(await res.json())
    }
  }

  const reviewApplication = async (appId, action) => {
    await fetch(`${API_BASE}/applications/${appId}/${action}`, { method: 'PATCH' })
    fetchApplications()
  }

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/agent-events`)
    const data = await res.json()
    setAgentEvents(data)
  }

  const fetchSummary = async () => {
    const res = await fetch(`${API_BASE}/dashboard/summary`)
    if (res.ok) setSummary(await res.json())
  }

  const fetchAuditLog = async () => {
    const res = await fetch(`${API_BASE}/audit-log`)
    if (res.ok) setAuditLog(await res.json())
  }

  const createDrive = async () => {
    if (!selectedCompanyId) {
      alert("Please select a company!")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/drives?company_id=${selectedCompanyId}`, { method: 'POST' })
      const data = await res.json()
      setDriveId(data.id)
      setStep(1)
      setIsCreateModalOpen(false)
      fetchEvents()
      fetchSummary()
      fetch(`${API_BASE}/drives`).then(res => res.json()).then(setDrives)
    } finally {
      setLoading(false)
    }
  }

  const parseJd = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/drives/${driveId}/parse-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setParsedJd(data)
      setStep(2)
    } catch (e) {
      alert("Error extracting JD: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmJd = async () => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/drives/${driveId}/jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedJd)
      })
      setStep(3)
      fetchEvents()
      fetchSummary()
      fetch(`${API_BASE}/drives`).then(res => res.json()).then(setDrives)
    } finally {
      setLoading(false)
    }
  }

  const runEligibility = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/drives/${driveId}/eligibility`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEligibility(data)
      setStep(4)
      fetchSummary()
    } catch (e) {
      alert("Error filtering eligibility: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const runMatching = async () => {
    setStep(4)
    const res = await fetch(`${API_BASE}/drives/${driveId}/matches`, {
      method: 'POST'
    })
    const data = await res.json()
    setMatches(data)
    setStep(5)
    fetchEvents()
    fetchSummary()
  }

  const approveShortlist = async () => {
    const studentIds = matches.map(m => m.student_id)
    await fetch(`${API_BASE}/drives/${driveId}/shortlist/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentIds)
    })
    setStep(6)
    fetchEvents()
    fetchSummary()
    fetchAuditLog()
  }

  const generateSchedule = async () => {
    await fetch(`${API_BASE}/drives/${driveId}/schedule/generate`, { method: 'POST' })
    const res = await fetch(`${API_BASE}/drives/${driveId}/schedule`)
    const data = await res.json()
    setSchedule(data)
    setStep(7)
    fetchEvents()
    fetchSummary()
  }

  const detectExceptions = async () => {
    await fetch(`${API_BASE}/exceptions/check`, { method: 'POST' })
    const res = await fetch(`${API_BASE}/exceptions`)
    const data = await res.json()
    setExceptions(data)
    fetchEvents()
    fetchSummary()
  }

  const simulateConflict = async () => {
    await fetch(`${API_BASE}/demo/simulate-panel-conflict${driveId ? `?drive_id=${driveId}` : ''}`, { method: 'POST' })
    await detectExceptions()
  }

  const sendNotifications = async () => {
    await fetch(`${API_BASE}/drives/${driveId}/notifications/send`, { method: 'POST' })
    fetchEvents()
  }

  const showEvidence = async (match) => {
    const res = await fetch(`${API_BASE}/matching/${match.drive_id}/${match.student_id}/evidence`)
    if (res.ok) {
      setSelectedEvidence(await res.json())
      setTimeout(() => {
        document.getElementById("evidence-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }

  const startNegotiation = async (excId) => {
    const res = await fetch(`${API_BASE}/exceptions/${excId}/negotiate`, { method: 'POST' })
    const data = await res.json()
    setNegotiation({ exceptionId: excId, options: data.options, recommendation: data.recommendation })
  }

  const resolveException = async (excId, resolutionId) => {
    await fetch(`${API_BASE}/exceptions/${excId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_id: resolutionId })
    })
    setNegotiation(null)
    detectExceptions()
    fetchAuditLog()
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          Placera
        </div>
        <div className="d-flex gap-lg items-center text-sm">
          <strong style={{ cursor: "pointer", borderBottom: currentView === 'dashboard' ? "2px solid var(--primary)" : "none", paddingBottom: "2px", fontWeight: currentView === 'dashboard' ? 600 : 400, color: currentView === 'dashboard' ? 'var(--on-background)' : 'var(--secondary)' }} onClick={() => setCurrentView('dashboard')}>Dashboard</strong>
          <strong style={{ cursor: "pointer", borderBottom: currentView === 'drives' ? "2px solid var(--primary)" : "none", paddingBottom: "2px", fontWeight: currentView === 'drives' ? 600 : 400, color: currentView === 'drives' ? 'var(--on-background)' : 'var(--secondary)' }} onClick={() => setCurrentView('drives')}>Drives</strong>
          <strong style={{ cursor: "pointer", borderBottom: currentView === 'activity' ? "2px solid var(--primary)" : "none", paddingBottom: "2px", fontWeight: currentView === 'activity' ? 600 : 400, color: currentView === 'activity' ? 'var(--on-background)' : 'var(--secondary)' }} onClick={() => { setCurrentView('activity'); fetchEvents(); }}>Activity</strong>
          <span style={{ cursor: "pointer", color: "var(--secondary)" }} onClick={logout}>Logout</span>
        </div>
        <div className="d-flex gap-md items-center">
          <div style={{ position: 'relative' }}>
            <span 
              className="material-symbols-outlined" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >notifications</span>
            {applications.filter(a => a.status === 'PENDING').length > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--error)' }}></div>
            )}
            {showNotifications && (
              <div style={{ position: 'absolute', top: 32, right: 0, width: 320, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '8px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)', fontWeight: 600 }}>Notifications</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {applications.filter(a => a.status === 'PENDING').length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--secondary)', fontSize: 13 }}>No new applications</div>
                  ) : (
                    applications.filter(a => a.status === 'PENDING').map(app => (
                      <div key={app.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--outline-variant)' }}>
                        <div style={{ fontSize: 13, marginBottom: 8 }}>
                          <strong>{app.student_name}</strong> applied for <strong>{app.company_name}</strong> ({app.role})
                        </div>
                        <div className="d-flex gap-sm">
                          <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => reviewApplication(app.id, 'approve')}>Approve</button>
                          <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => reviewApplication(app.id, 'reject')}>Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="material-symbols-outlined">settings</span>
        </div>
      </header>

      <main className="main-content" style={currentView === 'activity' ? { gridTemplateColumns: '1fr' } : {}}>
        <div className="d-flex flex-col gap-xl">
          <div className="d-flex flex-col gap-xs">
            <h1>{currentView === 'dashboard' ? "Placement Hub" : currentView === 'activity' ? "System Activity Logs" : "Drives Management"}</h1>
            {/* Subtitle removed */}
          </div>

          {currentView === 'dashboard' ? (
            <section className="d-flex flex-col gap-md">
              <h2>Overview</h2>
              <div className="kpi-grid">
                {[
                  ['Active Drives', summary?.active_drives ?? 0, 'work'],
                  ['Eligible Students', summary?.eligible_students ?? 0, 'groups'],
                  ['Shortlisted', summary?.shortlisted_students ?? 0, 'how_to_reg'],
                  ['Interviews', summary?.interviews ?? 0, 'calendar_month'],
                  ['Pending Actions', summary?.pending_tpo_actions ?? 0, 'pending_actions'],
                  ['Active Conflicts', summary?.active_conflicts ?? 0, 'warning'],
                  ['Offers Accepted', summary?.offers_accepted ?? 0, 'verified'],
                ].map(([label, value, icon]) => (
                  <div className="kpi-card" key={label}>
                    <span className="material-symbols-outlined">{icon}</span>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="control-grid">
                <div className="card">
                  <h3>Live Agent Activity</h3>
                  <div className="activity-feed">
                    {agentEvents.slice(0, 7).map(evt => (
                      <div className="activity-item" key={evt.id}>
                        <span className={`status-dot ${evt.status?.toLowerCase()}`}></span>
                        <div>
                          <strong>{evt.agent}</strong>
                          <p>{evt.message}</p>
                        </div>
                        <time>{new Date(evt.timestamp).toLocaleTimeString()}</time>
                      </div>
                    ))}
                    {agentEvents.length === 0 && <p className="text-secondary text-sm">No activity recorded yet.</p>}
                  </div>
                </div>
                <div className="card">
                  <h3>Audit Trail</h3>
                  <div className="activity-feed">
                    {auditLog.slice(0, 6).map(item => (
                      <div className="activity-item" key={item.id}>
                        <span className="material-symbols-outlined text-secondary">history</span>
                        <div>
                          <strong>{item.action}</strong>
                          <p>{item.entity} #{item.entity_id}</p>
                        </div>
                        <time>{new Date(item.timestamp).toLocaleTimeString()}</time>
                      </div>
                    ))}
                    {auditLog.length === 0 && <p className="text-secondary text-sm">No approvals recorded yet.</p>}
                  </div>
                </div>
              </div>
            </section>
          ) : currentView === 'activity' ? (
            <section className="d-flex flex-col gap-md">
              <div className="d-flex justify-between items-center">
                <h2>Multi-Agent Activity Logs</h2>
                <button className="btn btn-secondary" onClick={fetchEvents}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span> Refresh</button>
              </div>
              <div className="card">
                {agentEvents.length === 0 ? (
                  <p className="text-secondary text-center py-xl">No activity recorded yet.</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Agent</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentEvents.map(evt => (
                          <tr key={evt.id}>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--secondary)' }}>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                            <td style={{ fontWeight: 600 }}>{evt.agent}</td>
                            <td>{evt.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              <section className="d-flex flex-col gap-md">
                <h2>Active Placement Drives</h2>
                <div className="card">
                  {!driveId ? (
                    <div className="d-flex flex-col gap-md">
                      <div className="d-flex justify-between items-center" style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>All Drives</h3>
                        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} disabled={loading}>
                          {loading ? <l-dot-pulse size="24" speed="1.3" color="white"></l-dot-pulse> : <><span className="material-symbols-outlined">add</span> Create New Drive</>}
                        </button>
                      </div>
                      {isCreateModalOpen && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                          <div className="card" style={{ width: '400px', background: 'var(--surface)' }}>
                            <h3 style={{ marginTop: 0 }}>Create New Placement Drive</h3>
                            <div className="d-flex flex-col gap-sm mt-md">
                              <label className="text-secondary text-sm">Select Company</label>
                              <select 
                                value={selectedCompanyId} 
                                onChange={e => setSelectedCompanyId(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--outline)', background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
                              >
                                <option value="" disabled>Select a company...</option>
                                {companies.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="d-flex justify-end gap-sm mt-lg">
                              <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                              <button className="btn btn-primary" onClick={createDrive} disabled={!selectedCompanyId || loading}>
                                {loading ? "Creating..." : "Create Drive"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {drives.length === 0 ? (
                        <p className="text-secondary text-center py-xl">No active drives found. Create one to get started.</p>
                      ) : (
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {drives.map(d => (
                                <tr key={d.id}>
                                  <td>#{d.id}</td>
                                  <td style={{ fontWeight: 500 }}>{d.company_name}</td>
                                  <td>{d.role}</td>
                                  <td><span className="badge" style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}>{d.status.replace('_', ' ')}</span></td>
                                  <td>
                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => resumeDrive(d)}>Open</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-between items-center mb-md">
                        <button className="btn btn-secondary" style={{ background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }} onClick={handleBackToDrives}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> Back to Drives
                        </button>
                      </div>
                      <div className="card-header">
                        <div>
                          <h3>{currentDrive?.company_name || 'Loading Company...'}</h3>
                          <p className="text-secondary text-sm">{currentDrive?.role && currentDrive.role !== 'Unspecified Role' ? currentDrive.role : 'Role pending JD extraction...'}</p>
                        </div>
                        <span className="badge">Active</span>
                      </div>

                      {step >= 1 && step < 3 && (
                        <div className="mt-md d-flex flex-col gap-sm">
                          <span className="text-secondary text-sm font-bold">1. Job Description Details</span>
                          <textarea rows="4" value={jdText} onChange={e => setJdText(e.target.value)} />
                          {step === 1 ? (
                            <button className="btn btn-secondary" onClick={parseJd} style={{ alignSelf: 'flex-start' }} disabled={loading}>{loading ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : "Extract Requirements"}</button>
                          ) : (
                            <div className="d-flex flex-col gap-xs">
                              <pre style={{ fontSize: '12px', background: 'var(--surface-container-low)', padding: '8px', borderRadius: '8px' }}>
                                {JSON.stringify(parsedJd, null, 2)}
                              </pre>
                              <button className="btn btn-primary mt-sm" onClick={confirmJd} style={{ alignSelf: 'flex-start' }} disabled={loading}>{loading ? <l-dot-pulse size="24" speed="1.3" color="white"></l-dot-pulse> : "Confirm & Publish"}</button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="d-flex justify-between mt-md">
                        <div className="d-flex flex-col">
                          <span className="text-secondary text-sm">Status</span>
                          <span className="text-sm">
                            {step < 3 ? "JD Intake" : step === 3 ? "Eligibility Phase" : step === 4 ? "Matching Phase" : step === 5 ? "Shortlist Approval" : "Scheduling"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-sm">
                        <div className="d-flex justify-between text-sm mb-xs">
                          <span className="text-secondary">Pipeline Progress</span>
                          <span>{Math.round((step / 7) * 100)}%</span>
                        </div>
                        <div className="progress-bg">
                          <div className="progress-fill" style={{ width: `${(step / 7) * 100}%` }}></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {step >= 3 && (
                <section className="d-flex flex-col gap-md mt-lg">
                  <h2>Eligibility & Matching</h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Match Score</th>
                          <th>Match Logic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {step === 3 && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: "center", padding: "24px" }}>
                              <p>Criteria confirmed. Ready to filter eligible students.</p>
                              <button className="btn btn-secondary mt-md mx-auto" onClick={runEligibility} style={{ margin: "16px auto 0" }} disabled={loading}>{loading ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : "Run Eligibility Filter"}</button>
                            </td>
                          </tr>
                        )}
                        {step === 4 && (
                          <>
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center", padding: "24px", background: 'var(--surface-container-lowest)' }}>
                                <p style={{ fontWeight: '500' }}>Eligibility run complete. {eligibility?.eligible_count} students eligible.</p>
                                <button className="btn btn-primary mt-md mx-auto" onClick={runMatching} style={{ margin: "16px auto 0" }} disabled={loading}>{loading ? <l-dot-pulse size="24" speed="1.3" color="white"></l-dot-pulse> : "Run AI Matching"}</button>
                              </td>
                            </tr>
                            {eligibility?.results?.map(s => (
                              <tr key={s.id}>
                                <td>Student #{s.student_id}</td>
                                <td>
                                  <span style={{
                                    fontSize: '12px', padding: '4px 8px', borderRadius: '12px',
                                    background: s.is_eligible ? 'var(--primary)' : 'var(--error)',
                                    color: 'white'
                                  }}>
                                    {s.is_eligible ? 'Eligible' : 'Rejected'}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--on-surface-variant)' }}>{s.reason}</td>
                              </tr>
                            ))}
                          </>
                        )}
                        {matches.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>Student #{m.student_id}</td>
                            <td><span className="badge active">{m.match_score.toFixed(1)}%</span></td>
                            <td className="text-secondary text-sm">
                              {m.explanation}
                              <button className="link-button" onClick={() => showEvidence(m)}>Why this student?</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedEvidence && (
                    <div id="evidence-section" className="card evidence-card">
                      <div className="card-header">
                        <div>
                          <h3>Evidence Graph: Student #{selectedEvidence.student_id}</h3>
                          <p className="text-secondary text-sm">{selectedEvidence.explanation}</p>
                        </div>
                        <span className="badge active">{selectedEvidence.match_score.toFixed(1)}%</span>
                      </div>
                      <div className="skill-graph">
                        <div className="graph-root">Job Requirements</div>
                        {[...selectedEvidence.matched_skills, ...selectedEvidence.missing_skills].map(skill => {
                          const matched = selectedEvidence.matched_skills.includes(skill)
                          const evidence = selectedEvidence.skill_evidence?.[skill] || []
                          return (
                            <div className={`graph-node ${matched ? 'matched' : 'missing'}`} key={skill}>
                              <strong>{skill}</strong>
                              <span>{matched ? 'Matched' : 'Skill gap'}</span>
                              <small>{matched ? (Array.isArray(evidence) ? evidence.join(', ') : evidence) : 'No supporting evidence found.'}</small>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {step >= 6 && schedule.length > 0 && (
                <section className="d-flex flex-col gap-md mt-lg">
                  <h2>Interview Schedules</h2>
                  <div className="card">
                    <p style={{ fontWeight: 600, fontSize: '18px', marginBottom: '16px' }}>Interviews Scheduled: {schedule.length}</p>
                    <div className="table-container mb-md">
                      <table>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Panel</th>
                            <th>Room</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map(s => (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 500 }}>{s.student_name}</td>
                              <td>{s.panel_name}</td>
                              <td>{s.venue_name}</td>
                              <td className="text-sm">
                                {new Date(s.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(s.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </td>
                              <td>
                                <span style={{
                                  fontSize: '12px', padding: '4px 8px', borderRadius: '12px',
                                  background: s.status === 'CONFLICT' ? 'var(--error)' : 'var(--primary)',
                                  color: 'white'
                                }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {exceptions.length > 0 ? (
                      <div className="exceptions-list">
                        <strong>Conflicts Detected!</strong>
                        {exceptions.map(e => (
                          <div key={e.id} className="mt-sm">
                            <p className="text-sm">{e.description} ({e.status})</p>
                            {e.status === "OPEN" && !negotiation && (
                              <button onClick={() => startNegotiation(e.id)} style={{ padding: '8px 16px', background: 'white', color: 'black', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px' }}>Negotiate Resolution</button>
                            )}
                            {negotiation && negotiation.exceptionId === e.id && (
                              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 8px 0' }}>Multi-Agent Proposal</h4>
                                {negotiation.options.map(opt => (
                                  <div key={opt.id} style={{ marginBottom: '8px', padding: '8px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px' }}>
                                    <strong>{opt.title}</strong> {opt.is_recommended && <span style={{ background: 'green', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Recommended</span>}
                                    <p style={{ fontSize: '12px', margin: '4px 0' }}>Tradeoffs: {opt.tradeoffs}</p>
                                    <button onClick={() => resolveException(e.id, opt.id)} style={{ padding: '4px 8px', background: 'var(--primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Approve</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm mt-sm" style={{ color: 'green' }}>No conflicts detected.</p>
                    )}
                    <div className="d-flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={simulateConflict}>
                        <span className="material-symbols-outlined">report</span> Simulate Panel Conflict
                      </button>
                      <button className="btn btn-primary" onClick={sendNotifications}>
                        <span className="material-symbols-outlined">outgoing_mail</span> Send Mock Notifications
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

        </div>

        {/* Sidebar */}
        <div className="d-flex flex-col gap-md">
          {currentView !== 'activity' && (
            <div className="card" style={{ position: 'sticky', top: '24px' }}>
              <h3 style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px' }}>Quick Actions</h3>

            <button
              className="btn btn-secondary btn-quick-action mt-md"
              onClick={runEligibility}
              disabled={step !== 3 || loading}
            >
              {(loading && step === 3) ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : <><span className="material-symbols-outlined">filter_alt</span> Filter Eligibility</>}
            </button>

            <button
              className="btn btn-secondary btn-quick-action mt-sm"
              onClick={approveShortlist}
              disabled={step !== 5}
            >
              <span className="material-symbols-outlined">check_circle</span> Approve Shortlist
            </button>

            <button
              className="btn btn-secondary btn-quick-action mt-sm"
              onClick={generateSchedule}
              disabled={step !== 6 || loading}
            >
              {(loading && step === 6) ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : <><span className="material-symbols-outlined">calendar_month</span> Generate Schedule</>}
            </button>

            <button
              className="btn btn-secondary btn-quick-action mt-sm"
              onClick={detectExceptions}
              disabled={step < 7}
            >
              <span className="material-symbols-outlined">warning</span> Detect Exceptions
            </button>

            <button
              className="btn btn-secondary btn-quick-action mt-sm"
              onClick={fetchSummary}
            >
              <span className="material-symbols-outlined">monitoring</span> Refresh KPIs
            </button>

            {/* System Status Removed */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StudentDashboard({ user, logout }) {
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [generatingPlanId, setGeneratingPlanId] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [drives, setDrives] = useState([])
  const [matches, setMatches] = useState([])
  const [offers, setOffers] = useState([])
  const [readinessPlans, setReadinessPlans] = useState([])
  const [appliedDrives, setAppliedDrives] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/drives`)
      .then(res => res.json())
      .then(data => setDrives(data))
      .catch(err => console.error("Error fetching drives:", err))
    refreshStudentData()
  }, [])

  const refreshStudentData = async () => {
    if (!user.student_id) return
    const [resumeRes, matchesRes, offersRes, readinessRes, appsRes] = await Promise.all([
      fetch(`${API_BASE}/students/${user.student_id}/resume`),
      fetch(`${API_BASE}/students/${user.student_id}/matches`),
      fetch(`${API_BASE}/students/${user.student_id}/offers`),
      fetch(`${API_BASE}/readiness/${user.student_id}`),
      fetch(`${API_BASE}/applications`)
    ])
    if (resumeRes.ok) {
      const resume = await resumeRes.json()
      setParsedData(resume.structured_data)
    }
    if (matchesRes.ok) setMatches(await matchesRes.json())
    if (offersRes.ok) setOffers(await offersRes.json())
    if (readinessRes.ok) setReadinessPlans(await readinessRes.json())
    if (appsRes.ok) {
      const apps = await appsRes.json()
      setAppliedDrives(apps.filter(a => a.student_id === user.student_id).map(a => a.drive_id))
    }
  }

  const handleResumeUpload = async () => {
    if (!resumeFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", resumeFile)

    try {
      const res = await fetch(`${API_BASE}/students/${user.student_id}/resume`, {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.parsed_data) {
        setParsedData(data.parsed_data)
      }
      setUploading(false)
      setUploadSuccess(true)
      refreshStudentData()
    } catch (err) {
      setUploading(false)
      alert("Failed to upload/parse resume: " + err.message)
    }
  }

  const generateReadiness = async (match) => {
    setGeneratingPlanId(match.id)
    try {
      await fetch(`${API_BASE}/readiness/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.student_id, drive_id: match.drive_id })
      })
      await refreshStudentData()
    } finally {
      setGeneratingPlanId(null)
    }
  }

  const acceptOffer = async (offerId) => {
    await fetch(`${API_BASE}/offers/${offerId}/accept`, { method: 'PATCH' })
    refreshStudentData()
  }

  const handleApply = async (driveId) => {
    setAppliedDrives(prev => [...prev, driveId])
    await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: user.student_id, drive_id: driveId })
    })
    alert("Application submitted successfully! The TPO will review your profile.")
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          Placera
        </div>
        <div className="d-flex gap-lg items-center text-sm">
          <strong style={{ cursor: "pointer", borderBottom: "2px solid var(--primary)", paddingBottom: "2px" }}>Dashboard</strong>
          <span style={{ cursor: "pointer", color: "var(--secondary)" }} onClick={logout}>Logout</span>
        </div>
        <div className="d-flex gap-md items-center">
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>

      <main className="main-content">
        <div className="d-flex flex-col gap-xl">
          <div className="d-flex flex-col gap-xs">
            <h1>Dashboard</h1>
            <p className="subtitle">Welcome back. Here is your current placement status.</p>
          </div>

          <section className="d-flex flex-col gap-md">
            <h2>Recommended Drives</h2>
            <div className="d-flex flex-col gap-md">

              {drives.length === 0 ? (
                <p className="text-secondary text-center py-xl">No recommended drives available right now.</p>
              ) : (
                drives.map(drive => (
                  <div key={drive.id} className="card d-flex items-center justify-between" style={{ flexDirection: 'row' }}>
                    <div className="d-flex items-center gap-md">
                      <div style={{ width: 48, height: 48, borderRadius: '8px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined text-secondary">domain</span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '20px' }}>{drive.company_name}</h3>
                        <p className="text-secondary text-sm">{drive.role && drive.role !== 'Unspecified Role' ? drive.role : 'Role TBD'}</p>
                      </div>
                    </div>
                    <div className="d-flex items-center gap-md">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleApply(drive.id)}
                        disabled={appliedDrives.includes(drive.id)}
                      >
                        {appliedDrives.includes(drive.id) ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="d-flex flex-col gap-md">
            <h2>My Match Explanations</h2>
            <div className="d-flex flex-col gap-md">
              {matches.slice(0, 5).map(match => (
                <div key={match.id} className="card">
                  <div className="card-header">
                    <div>
                      <h3>Drive #{match.drive_id}</h3>
                      <p className="text-secondary text-sm">{match.explanation}</p>
                    </div>
                    <span className="badge active">{match.match_score.toFixed(1)}%</span>
                  </div>
                  <div className="d-flex gap-xs" style={{ flexWrap: 'wrap' }}>
                    {(match.matched_skills || '').split(',').filter(Boolean).map(skill => <span key={skill} className="badge success">{skill}</span>)}
                    {(match.missing_skills || '').split(',').filter(Boolean).map(skill => <span key={skill} className="badge warning">{skill}</span>)}
                  </div>
                  <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => generateReadiness(match)} disabled={generatingPlanId === match.id}>
                    {generatingPlanId === match.id ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : <><span className="material-symbols-outlined">psychology</span> Generate Readiness Plan</>}
                  </button>
                </div>
              ))}
              {matches.length === 0 && <p className="text-secondary text-sm">No match recommendations available yet.</p>}
            </div>
          </section>

          <section className="d-flex flex-col gap-md">
            <h2>Readiness Coach</h2>
            <div className="card">
              {readinessPlans.length > 0 ? readinessPlans.slice(0, 2).map(plan => (
                <div key={plan.id} className="readiness-plan">
                  <div className="card-header">
                    <strong>Drive #{plan.drive_id}</strong>
                    <span className="badge active">{plan.readiness_score.toFixed(1)}%</span>
                  </div>
                  <p className="text-secondary text-sm">Skill gaps: {plan.skill_gaps || 'None'}</p>
                  <pre>{plan.plan}</pre>
                </div>
              )) : <p className="text-secondary text-sm">Generate a plan from one of your match explanations.</p>}
            </div>
          </section>

          <section className="d-flex flex-col gap-md">
            <h2>Offers</h2>
            <div className="card">
              {offers.map(offer => (
                <div key={offer.id} className="offer-row">
                  <div>
                    <strong>Drive #{offer.drive_id}</strong>
                    <p className="text-secondary text-sm">Status: {offer.status}</p>
                  </div>
                  {offer.status === 'PENDING' && (
                    <button className="btn btn-primary" onClick={() => acceptOffer(offer.id)}>
                      Accept Offer
                    </button>
                  )}
                </div>
              ))}
              {offers.length === 0 && <p className="text-secondary text-sm">No offers recorded yet.</p>}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="d-flex flex-col gap-md">
          {/* Profile Card */}
          <div className="card">
            <div className="d-flex items-start justify-between">
              <div>
                <h3>My Profile</h3>
                <p className="text-secondary text-sm mt-xs">{parsedData?.branch || 'Profile pending resume extraction'}</p>
              </div>
              <span className="material-symbols-outlined text-secondary">person</span>
            </div>

            <div className="d-flex items-center gap-md mt-sm">
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', overflow: 'hidden' }}>
              </div>
              <div>
                <p className="text-secondary text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: 0 }}>Current CGPA</p>
                <p style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{parsedData?.cgpa || '—'}</p>
              </div>
            </div>

            <div className="mt-md">
              <p className="text-secondary text-sm font-bold mb-sm" style={{ textTransform: 'uppercase', letterSpacing: 0 }}>Key Skills</p>
              <div className="d-flex gap-sm" style={{ flexWrap: 'wrap' }}>
                {(parsedData?.skills || []).slice(0, 8).map((skill, index) => (
                  <span key={index} className="badge" style={{ border: '1px solid var(--outline)' }}>{skill.name || skill}</span>
                ))}
                {(!parsedData?.skills || parsedData.skills.length === 0) && <span className="text-secondary text-sm">Upload a resume to extract skills.</span>}
              </div>
            </div>
          </div>

          {/* Quick Actions & Resume */}
          <div className="card">
            <h4 className="text-secondary text-sm font-bold mb-md" style={{ textTransform: 'uppercase', letterSpacing: 0, margin: '0 0 16px 0' }}>Resume Intelligence</h4>
            <div className="d-flex flex-col gap-sm">
              <input type="file" accept="application/pdf" onChange={e => setResumeFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              <button className="btn btn-primary justify-between" style={{ width: '100%' }} onClick={handleResumeUpload} disabled={uploading || !resumeFile}>
                {uploading ? "Parsing with AI..." : uploadSuccess ? "Profile Updated!" : "Extract Profile"} <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </button>
              {parsedData && (
                <div className="mt-sm p-sm" style={{ background: 'var(--surface-container-low)', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--outline-variant)' }}>
                  <p className="font-bold mb-xs" style={{ color: 'var(--primary)' }}>Extracted with Gemini AI:</p>
                  <div className="d-flex gap-sm" style={{ flexWrap: 'wrap', marginBottom: '8px' }}>
                    {parsedData.skills?.map((s, i) => (
                      <span key={i} className="badge" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '2px 6px', fontSize: '10px' }}>{s.name}</span>
                    ))}
                  </div>
                  {parsedData.cgpa && <p style={{ margin: '2px 0' }}><strong>CGPA:</strong> {parsedData.cgpa}</p>}
                  {parsedData.projects?.length > 0 && <p style={{ margin: '2px 0' }}><strong>Projects:</strong> {parsedData.projects.length} found</p>}
                </div>
              )}
            </div>

            <h4 className="text-secondary text-sm font-bold mt-md mb-md" style={{ textTransform: 'uppercase', letterSpacing: 0, margin: '16px 0' }}>Quick Actions</h4>
            <div className="d-flex flex-col gap-sm">
              <button className="btn btn-secondary justify-between" style={{ width: '100%' }}>
                Mock Interview <span className="material-symbols-outlined text-sm">video_camera_front</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('placera_user')
    if (saved) return JSON.parse(saved)
    return null
  })

  const handleAuthSuccess = (userData) => {
    localStorage.setItem('placera_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('placera_user')
    setUser(null)
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  if (user.role === 'student') {
    return <StudentDashboard user={user} logout={handleLogout} />
  }

  return <TPODashboard user={user} logout={handleLogout} />
}
