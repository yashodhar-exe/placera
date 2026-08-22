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
  const [negotiation, setNegotiation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'drives'
  
  const [drives, setDrives] = useState([])
  const currentDrive = drives.find(d => d.id === driveId)

  useEffect(() => {
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
  }

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/agent-events`)
    const data = await res.json()
    setAgentEvents(data)
  }

  const createDrive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/drives?company_id=1`, { method: 'POST' })
      const data = await res.json()
      setDriveId(data.id)
      setStep(1)
      fetchEvents()
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
  }

  const approveShortlist = async () => {
    const studentIds = matches.map(m => m.student_id)
    await fetch(`${API_BASE}/drives/${driveId}/shortlist/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentIds)
    })
    setStep(6)
  }

  const generateSchedule = async () => {
    await fetch(`${API_BASE}/drives/${driveId}/schedule/generate`, { method: 'POST' })
    const res = await fetch(`${API_BASE}/drives/${driveId}/schedule`)
    const data = await res.json()
    setSchedule(data)
    setStep(7)
    fetchEvents()
  }

  const detectExceptions = async () => {
    await fetch(`${API_BASE}/exceptions/check`, { method: 'POST' })
    const res = await fetch(`${API_BASE}/exceptions`)
    const data = await res.json()
    setExceptions(data)
    fetchEvents()
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
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">settings</span>
        </div>
      </header>

      <main className="main-content">
        <div className="d-flex flex-col gap-xl">
          <div className="d-flex flex-col gap-xs">
            <h1>{currentView === 'dashboard' ? "Placement Hub" : currentView === 'activity' ? "System Activity Logs" : "Drives Management"}</h1>
            {/* Subtitle removed */}
          </div>

          {currentView === 'dashboard' ? (
            <section className="d-flex flex-col gap-md">
              <h2>Overview</h2>
              <div className="card">
                <p className="text-secondary text-center py-xl">Welcome to Placera. Switch to the Drives tab to manage placement workflows.</p>
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
                        <button className="btn btn-primary" onClick={createDrive} disabled={loading}>
                          {loading ? <l-dot-pulse size="24" speed="1.3" color="white"></l-dot-pulse> : <><span className="material-symbols-outlined">add</span> Create New Drive</>}
                        </button>
                      </div>
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
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {drives.map(d => (
                                <tr key={d.id}>
                                  <td>#{d.id}</td>
                                  <td style={{ fontWeight: 500 }}>{d.company_name}</td>
                                  <td>{d.role}</td>
                                  <td><span className="badge" style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}>{d.status.replace('_', ' ')}</span></td>
                                  <td style={{ textAlign: 'right' }}>
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
                            <td className="text-secondary text-sm">{m.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {step >= 6 && schedule.length > 0 && (
                <section className="d-flex flex-col gap-md mt-lg">
                  <h2>Interview Schedules</h2>
                  <div className="card">
                    <p>Interviews Scheduled: {schedule.length}</p>
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
                  </div>
                </section>
              )}
            </>
          )}

        </div>

        {/* Sidebar */}
        <div className="d-flex flex-col gap-md">
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px' }}>Quick Actions</h3>

            <button
              className="btn btn-secondary mt-md"
              onClick={runEligibility}
              disabled={step !== 3 || loading}
            >
              {loading ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : <><span className="material-symbols-outlined">filter_alt</span> Filter Eligibility</>}
            </button>

            <button
              className="btn btn-secondary mt-sm"
              onClick={approveShortlist}
              disabled={step !== 5}
            >
              <span className="material-symbols-outlined">check_circle</span> Approve Shortlist
            </button>

            <button
              className="btn btn-secondary mt-sm"
              onClick={generateSchedule}
              disabled={step !== 6 || loading}
            >
              {loading ? <l-dot-pulse size="24" speed="1.3" color="black"></l-dot-pulse> : <><span className="material-symbols-outlined">calendar_month</span> Generate Schedule</>}
            </button>

            <button
              className="btn btn-secondary mt-sm"
              onClick={detectExceptions}
              disabled={step < 7}
            >
              <span className="material-symbols-outlined">warning</span> Detect Exceptions
            </button>

            {/* System Status Removed */}
          </div>
        </div>
      </main>
    </div>
  )
}

function StudentDashboard({ user, logout }) {
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [drives, setDrives] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/drives`)
      .then(res => res.json())
      .then(data => setDrives(data))
      .catch(err => console.error("Error fetching drives:", err))
  }, [])

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
    } catch (err) {
      setUploading(false)
      alert("Failed to upload/parse resume: " + err.message)
    }
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
                      <button className="btn btn-primary">Apply</button>
                    </div>
                  </div>
                ))
              )}
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
                <p className="text-secondary text-sm mt-xs">Computer Science & Engineering</p>
              </div>
              <span className="material-symbols-outlined text-secondary">person</span>
            </div>

            <div className="d-flex items-center gap-md mt-sm">
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', overflow: 'hidden' }}>
              </div>
              <div>
                <p className="text-secondary text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current CGPA</p>
                <p style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>8.5</p>
              </div>
            </div>

            <div className="mt-md">
              <p className="text-secondary text-sm font-bold mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Skills</p>
              <div className="d-flex gap-xs" style={{ flexWrap: 'wrap' }}>
                <span className="badge" style={{ border: '1px solid var(--outline)' }}>Python</span>
                <span className="badge" style={{ border: '1px solid var(--outline)' }}>React</span>
                <span className="badge" style={{ border: '1px solid var(--outline)' }}>TypeScript</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Resume */}
          <div className="card">
            <h4 className="text-secondary text-sm font-bold mb-md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Resume Intelligence</h4>
            <div className="d-flex flex-col gap-sm">
              <input type="file" accept="application/pdf" onChange={e => setResumeFile(e.target.files[0])} style={{ fontSize: '12px' }} />
              <button className="btn btn-primary justify-between" style={{ width: '100%' }} onClick={handleResumeUpload} disabled={uploading || !resumeFile}>
                {uploading ? "Parsing with AI..." : uploadSuccess ? "Profile Updated!" : "Extract Profile"} <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </button>
              {parsedData && (
                <div className="mt-sm p-sm" style={{ background: 'var(--surface-container-low)', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--outline-variant)' }}>
                  <p className="font-bold mb-xs" style={{ color: 'var(--primary)' }}>Extracted with Gemini AI:</p>
                  <div className="d-flex gap-xs" style={{ flexWrap: 'wrap', marginBottom: '8px' }}>
                    {parsedData.skills?.map((s, i) => (
                      <span key={i} className="badge" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '2px 6px', fontSize: '10px' }}>{s.name}</span>
                    ))}
                  </div>
                  {parsedData.cgpa && <p style={{ margin: '2px 0' }}><strong>CGPA:</strong> {parsedData.cgpa}</p>}
                  {parsedData.projects?.length > 0 && <p style={{ margin: '2px 0' }}><strong>Projects:</strong> {parsedData.projects.length} found</p>}
                </div>
              )}
            </div>

            <h4 className="text-secondary text-sm font-bold mt-md mb-md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0' }}>Quick Actions</h4>
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
