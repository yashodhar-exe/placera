import { useState } from 'react'
import './index.css'

const API_BASE = "http://localhost:8000/api"

function App() {
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
  
  // Basic student view toggle for MVP purposes
  const [view, setView] = useState("TPO")

  const fetchEvents = async () => {
    const res = await fetch(`${API_BASE}/agent-events`)
    const data = await res.json()
    setAgentEvents(data)
  }

  const createDrive = async () => {
    const res = await fetch(`${API_BASE}/drives?company_id=1`, { method: 'POST' })
    const data = await res.json()
    setDriveId(data.id)
    setStep(1)
    fetchEvents()
  }

  const parseJd = async () => {
    const res = await fetch(`${API_BASE}/drives/${driveId}/parse-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd_text: jdText })
    })
    const data = await res.json()
    setParsedJd(data)
    setStep(2)
  }

  const confirmJd = async () => {
    await fetch(`${API_BASE}/drives/${driveId}/jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedJd)
    })
    setStep(3)
  }

  const runEligibility = async () => {
    const res = await fetch(`${API_BASE}/drives/${driveId}/eligibility`)
    const data = await res.json()
    setEligibility(data)
    setStep(4)
  }

  const runMatching = async () => {
    await fetch(`${API_BASE}/drives/${driveId}/run-matching`, { method: 'POST' })
    const res = await fetch(`${API_BASE}/drives/${driveId}/matches`)
    const data = await res.json()
    setMatches(data)
    setStep(5)
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

  if (view === "STUDENT") {
    return <StudentDashboard switchView={() => setView("TPO")} />
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          <span className="material-symbols-outlined filled">school</span>
          AI Placement Agent
        </div>
        <div className="d-flex gap-lg items-center text-sm">
          <strong style={{ cursor: "pointer", borderBottom: "2px solid var(--primary)", paddingBottom: "2px" }}>Dashboard</strong>
          <span style={{ cursor: "pointer", color: "var(--secondary)" }}>Drives</span>
          <span style={{ cursor: "pointer", color: "var(--secondary)" }} onClick={() => setView("STUDENT")}>Switch to Student View</span>
        </div>
        <div className="d-flex gap-md items-center">
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">settings</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', overflow: 'hidden' }}>
            {/* Placeholder avatar */}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="d-flex flex-col gap-xl">
          <div className="d-flex flex-col gap-xs">
            <h1>Placement Hub</h1>
            <p className="subtitle">TPO Admin Console</p>
          </div>

          <section className="d-flex flex-col gap-md">
            <h2>Active Placement Drives</h2>
            <div className="card">
              {!driveId ? (
                <div className="d-flex items-center justify-between">
                  <p className="text-secondary">No active drives</p>
                  <button className="btn btn-primary" onClick={createDrive}>
                    <span className="material-symbols-outlined">add</span> Create New Drive
                  </button>
                </div>
              ) : (
                <>
                  <div className="card-header">
                    <div>
                      <h3>TechCorp</h3>
                      <p className="text-secondary text-sm">Software Engineer</p>
                    </div>
                    <span className="badge">Active</span>
                  </div>
                  
                  {step >= 1 && step < 3 && (
                    <div className="mt-md d-flex flex-col gap-sm">
                      <span className="text-secondary text-sm font-bold">1. Job Description Details</span>
                      <textarea rows="4" value={jdText} onChange={e => setJdText(e.target.value)} />
                      {step === 1 ? (
                        <button className="btn btn-secondary" onClick={parseJd} style={{ alignSelf: 'flex-start' }}>Extract Requirements</button>
                      ) : (
                        <div className="d-flex flex-col gap-xs">
                           <pre style={{ fontSize: '12px', background: 'var(--surface-container-low)', padding: '8px', borderRadius: '8px' }}>
                             {JSON.stringify(parsedJd, null, 2)}
                           </pre>
                           <button className="btn btn-primary mt-sm" onClick={confirmJd} style={{ alignSelf: 'flex-start' }}>Confirm & Publish</button>
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
                            <p>Eligibility run complete. {eligibility?.eligible_count} students eligible.</p>
                            <button className="btn btn-primary mt-md mx-auto" onClick={runMatching} style={{ margin: "16px auto 0" }}>Run AI Matching</button>
                         </td>
                       </tr>
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

        </div>

        {/* Sidebar */}
        <div className="d-flex flex-col gap-md">
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px' }}>Quick Actions</h3>
            
            <button 
              className="btn btn-secondary mt-md" 
              onClick={runEligibility}
              disabled={step !== 3}
            >
              <span className="material-symbols-outlined">filter_alt</span> Filter Eligibility
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
              disabled={step !== 6}
            >
              <span className="material-symbols-outlined">calendar_month</span> Generate Schedule
            </button>

            <button 
              className="btn btn-secondary mt-sm" 
              onClick={detectExceptions}
              disabled={step < 7}
            >
              <span className="material-symbols-outlined">warning</span> Detect Exceptions
            </button>

            <div className="mt-lg pt-md d-flex flex-col gap-sm" style={{ borderTop: '1px solid var(--outline-variant)' }}>
              <span className="text-secondary text-sm">System Status</span>
              <div className="d-flex items-center gap-sm text-sm" style={{ fontWeight: 600 }}>
                <span className="status-dot"></span> AI Engine: Operational
              </div>
            </div>
            
            {agentEvents.length > 0 && (
              <div className="mt-md pt-md d-flex flex-col gap-sm" style={{ borderTop: '1px solid var(--outline-variant)' }}>
                <span className="text-secondary text-sm">Agent Activity Panel</span>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agentEvents.map(evt => (
                    <div key={evt.id} style={{ padding: '8px', background: 'var(--surface-container-low)', borderRadius: '4px', fontSize: '12px' }}>
                      <strong style={{ color: 'var(--secondary)' }}>{new Date(evt.timestamp).toLocaleTimeString()} - {evt.agent}</strong>
                      <p style={{ margin: '4px 0 0 0' }}>{evt.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StudentDashboard({ switchView }) {
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleResumeUpload = async () => {
    if (!resumeFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", resumeFile)
    
    // Hardcoded student ID 1 for MVP
    await fetch(`${API_BASE}/students/1/resume`, {
      method: "POST",
      body: formData
    })
    setUploading(false)
    setUploadSuccess(true)
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          <span className="material-symbols-outlined filled">school</span>
          AI Placement Agent
        </div>
        <div className="d-flex gap-lg items-center text-sm">
          <strong style={{ cursor: "pointer", borderBottom: "2px solid var(--primary)", paddingBottom: "2px" }}>Dashboard</strong>
          <span style={{ cursor: "pointer", color: "var(--secondary)" }} onClick={switchView}>Switch to TPO View</span>
        </div>
        <div className="d-flex gap-md items-center">
          <span className="material-symbols-outlined">notifications</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', overflow: 'hidden' }}>
          </div>
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
              
              {/* Company Card 1 */}
              <div className="card d-flex items-center justify-between" style={{ flexDirection: 'row' }}>
                <div className="d-flex items-center gap-md">
                  <div style={{ width: 48, height: 48, borderRadius: '8px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined text-secondary">domain</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px' }}>TechCorp</h3>
                    <p className="text-secondary text-sm">Software Engineer (SDE I)</p>
                  </div>
                </div>
                <div className="d-flex items-center gap-md">
                  <div className="d-flex items-center gap-xs" style={{ background: 'var(--surface-container-low)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>bolt</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>92% Match</span>
                  </div>
                  <button className="btn btn-primary">Apply</button>
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', marginTop: '-8px' }}>
                <p className="text-sm font-bold mb-sm">Why am I a match?</p>
                <div className="d-flex gap-sm items-center mb-xs text-sm">
                  <span className="material-symbols-outlined text-sm" style={{ color: 'green' }}>check_circle</span>
                  <span><strong>Python:</strong> Found in "Smart Ambulance AI project"</span>
                </div>
                <div className="d-flex gap-sm items-center mb-md text-sm">
                  <span className="material-symbols-outlined text-sm" style={{ color: 'red' }}>cancel</span>
                  <span><strong>Docker:</strong> No supporting evidence found in resume.</span>
                </div>
                
                <p className="text-sm font-bold mb-sm pt-sm" style={{ borderTop: '1px solid var(--outline-variant)' }}>AI Readiness Coach (3-Day Plan)</p>
                <div className="text-sm text-secondary" style={{ whiteSpace: 'pre-line' }}>
                  Day 1: Review Docker containers and images. Build a simple Python container.\n
                  Day 2: Practice Docker Compose with a database.\n
                  Day 3: Do a mock technical interview focusing on containerization.
                </div>
              </div>

              {/* Company Card 2 */}
              <div className="card d-flex items-center justify-between" style={{ flexDirection: 'row' }}>
                <div className="d-flex items-center gap-md">
                  <div style={{ width: 48, height: 48, borderRadius: '8px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined text-secondary">language</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px' }}>GlobalNet</h3>
                    <p className="text-secondary text-sm">Frontend Developer</p>
                  </div>
                </div>
                <div className="d-flex items-center gap-md">
                  <div className="d-flex items-center gap-xs" style={{ border: '1px solid var(--outline)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
                    <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
                    <span className="text-secondary font-bold text-sm">88% Match</span>
                  </div>
                  <button className="btn btn-primary">Apply</button>
                </div>
              </div>

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

export default App
