# AI Campus Placement Operations & Interview Coordination Agent
## System Design Document (v1.0)

---

## 1. Overview

Campus placement drives involve a repetitive but high-stakes sequence: a company shares a job description, the placement cell filters eligible students, students are matched and ranked, interviews and tests are scheduled, panels and rooms are coordinated, and everyone is notified — usually across spreadsheets, email threads, and WhatsApp groups. This document specifies an **AI Placement Operations & Interview Coordination Agent** that automates this pipeline end-to-end while keeping a human (the Training & Placement Officer, "TPO") in control of every consequential decision.

The design borrows two proven ideas from recent literature:

- **Structured, ML-driven eligibility and ranking** (à la the XGBoost-based College Career Portal), used here for eligibility verification, candidate–JD matching, and skill-gap scoring.
- **A multi-agent, protocol-coordinated architecture** (à la Resume AI's MCP-based agent ecosystem), used here to decompose placement operations into independent, composable agents that hand off state through shared context objects rather than tight coupling.

### 1.1 Objectives
- Automate the operational workflow from **JD intake → eligibility → matching → scheduling → coordination → reporting**.
- Keep **final selection decisions human-owned** — the agent recommends, schedules, and coordinates; it never auto-selects or auto-rejects a candidate.
- Give **explainable** candidate-matching output (not a black-box score).
- Provide a **single dashboard** with pending actions, exceptions, and skill-gap analytics for the TPO.

### 1.2 Non-Goals
- The system does not replace recruiter-side interview conduct (that remains human or a separate assessment tool).
- The system does not make final admit/reject decisions — it surfaces ranked, explained recommendations only.

---

## 2. Problem Recap

| Pain point today | Root cause |
|---|---|
| Manual eligibility cross-checking | No centralized, queryable student record |
| Slow shortlisting for large drives | No automated JD-to-student matching |
| Interview logistics chaos (panels, rooms, slots) | No scheduling/coordination engine |
| Students miss updates | Fragmented, ad hoc notification channels |
| No visibility into readiness gaps | No skill-gap or analytics layer |

---

## 3. High-Level Architecture

The system follows a **hub-and-agent** model: a lightweight orchestration layer (the **Context Router**) passes a shared **Context Object** through a pipeline of specialized agents. Each agent is a stateless microservice that reads what it needs from the context, does one job well, writes its output back, and updates the routing list for the next agent(s).

```
                         ┌─────────────────────────────┐
                         │        TPO Dashboard         │
                         │  (pending actions, exceptions,│
                         │   analytics, overrides)       │
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │        Context Router          │
                         │  (creates/updates Context Obj, │
                         │   maintains agent routing list) │
                         └───────────────┬───────────────┘
        ┌────────────┬────────────┬─────┴──────┬─────────────┬────────────┐
        ▼            ▼            ▼             ▼             ▼            ▼
   JDIntake     Eligibility   Matching     Scheduling     Coordination  Notification
    Agent          Agent        Agent        Agent           Agent        Agent
        │            │            │             │             │            │
        └────────────┴─────┬──────┴─────────────┴─────────────┴────────────┘
                            ▼
                  ┌───────────────────┐
                  │  Analytics Agent   │──▶ Skill-gap & readiness scores
                  │  Reporting Agent   │──▶ Post-drive reports, dashboards
                  └───────────────────┘
                            │
                  ┌───────────────────┐
                  │   Data Layer       │
                  │ PostgreSQL (records)│
                  │ Vector DB (skills/JD)│
                  └───────────────────┘
```

All agents are independent FastAPI services connected through a message queue (Redis Streams), coordinated via a custom **Placement Context Protocol (PCP)** — a scoped adaptation of the Model Context Protocol pattern.

---

## 4. Agent Ecosystem

Nine agents cover the required prototype features. Each has a single responsibility, mirroring the "one microservice, one job" philosophy.

| # | Agent | Responsibility | Human checkpoint |
|---|---|---|---|
| 1 | **JDIntakeAgent** | Parses uploaded/company-submitted JD (PDF/text/form); extracts role, required skills, CGPA cutoff, branch eligibility, package, headcount | TPO confirms/edits extracted fields before publishing |
| 2 | **EligibilityAgent** | Runs rule-based + ML filtering against student records (CGPA, backlog history, branch, prior offer status) to produce the eligible pool | TPO can override individual exclusions |
| 3 | **MatchingAgent** | Scores each eligible student against the JD using a weighted, explainable similarity model; produces a ranked shortlist with reasons | TPO approves/adjusts shortlist before it's sent to the recruiter |
| 4 | **SchedulingAgent** | Proposes interview/test slots based on recruiter availability, room calendar, and student conflicts (e.g., overlapping drives) | TPO confirms final schedule |
| 5 | **CoordinationAgent** | Allocates panels (interviewer availability) and rooms/venues (physical or virtual link); resolves double-bookings | TPO resolves flagged conflicts |
| 6 | **NotificationAgent** | Sends eligibility results, schedule updates, and reminders to students and panel members via email/SMS/portal | Auto-sends only pre-approved templates; escalates anomalies |
| 7 | **AnalyticsAgent** | Computes skill-gap scores, placement-readiness index, department/batch trends | Read-only, feeds dashboard |
| 8 | **ReportingAgent** | Generates post-drive reports (offers, conversion rate, no-shows) for accreditation/institutional use | TPO exports/shares |
| 9 | **ExceptionAgent** | Watches the pipeline for anomalies — unresolved conflicts, missing data, low match confidence — and surfaces them as dashboard action items | Central to human-in-the-loop control |

This is intentionally leaner than Resume AI's 14-agent system: campus placement *operations* needs coordination and logistics agents (scheduling, panels, rooms) rather than resume-generation or GitHub-analysis agents, which belong to a separate candidate-facing product.

---

## 5. Data Model

A structured dataset, **Placement Operations Dataset (POD)**, underpins eligibility and matching, following the CCP-PAD pattern from the reference literature.

**Student record**
- Academic: 10th %, 12th %, CGPA, semester-wise marks, backlog history
- Skills: declared skills, proficiency levels, certifications, project tags
- Placement status: applied drives, current best offer, interview history
- Derived: **Academic Performance Index (API)**, **Skill Strength Index (SSI)**, **Placement Readiness Score (PRS)**

**Job/Drive record**
- Company, role, required skills (mandatory vs. preferred), eligibility cutoffs, package band, headcount, drive stage schedule

**Interview record**
- Panel members, room/link, time slot, student list, status (scheduled/completed/no-show), outcome (pending human entry)

Storage: **PostgreSQL** for structured records (students, drives, interviews); a **vector store** (e.g., ChromaDB/pgvector) for semantic embeddings of skills/JD text used in matching.

---

## 6. ML Components

### 6.1 Eligibility Filtering
Rule-based hard filters (CGPA cutoff, branch, backlog) run first — deterministic and auditable, since eligibility must be explainable and contestable. This deliberately avoids "black-box eligibility," unlike pure ML gating.

### 6.2 Candidate–JD Matching Score
Inspired by the multi-signal fit score in the reference systems:

```
M = w1·S_skill + w2·S_academic + w3·S_project + w4·S_readiness
```

- `S_skill` — overlap between JD required/preferred skills and student skill set (weighted, required > preferred)
- `S_academic` — normalized API against the JD's academic bar
- `S_project` — relevance of project/certification tags to role domain
- `S_readiness` — PRS, capturing mock-interview performance and completed prep milestones (if available)

Weights are tuned via a gradient-boosted model (XGBoost) trained on historical shortlisting/offer outcomes, following the same architecture pattern validated in the reference paper (binary logistic objective for "shortlisted/not," regression objective for expected package). **Every score ships with a feature-importance breakdown** so the TPO sees *why* a student ranked where they did — this is the "explanations" requirement from the problem statement, and it directly addresses the "black-box ATS" criticism raised in the second reference paper.

### 6.3 Skill-Gap & Readiness Analytics
For students not matching current drives, the AnalyticsAgent computes a gap vector (missing skills vs. most-demanded skills across recent drives) and a readiness trendline, surfaced to both the student and TPO.

---

## 7. Placement Context Protocol (PCP)

Adapted from the MCP pattern in the Resume AI reference:

- **Context Object**: `{ drive_id, task_id, session_id, payload: {}, routing: [] }`
- **Payload as shared notebook**: JDIntakeAgent writes parsed JD fields; EligibilityAgent reads them and writes the eligible pool; MatchingAgent reads the pool and writes the ranked shortlist — no agent re-queries the database for another agent's output.
- **Routing list**: each agent declares which agent(s) run next, so agents stay decoupled and the pipeline can branch (e.g., ExceptionAgent can re-route back to CoordinationAgent on a conflict).
- **Idempotency**: each task has a unique ID; duplicate messages (queue retries) are detected and skipped.
- **Human-override hooks**: every payload write includes a `requires_approval` flag; the Context Router pauses the pipeline at that node until the TPO dashboard records an approve/edit action.

---

## 8. End-to-End Workflow

1. **JD Intake** — Recruiter/TPO submits JD → JDIntakeAgent extracts structured fields → TPO confirms.
2. **Eligibility** — EligibilityAgent filters POD against JD criteria → eligible pool generated → exceptions (e.g., borderline CGPA) flagged for TPO review.
3. **Matching & Ranking** — MatchingAgent scores eligible pool → ranked, explained shortlist → TPO approves or edits.
4. **Scheduling** — SchedulingAgent proposes slots avoiding student/panel conflicts → TPO confirms.
5. **Coordination** — CoordinationAgent locks panels and rooms/links → ExceptionAgent flags double-bookings.
6. **Notification** — NotificationAgent sends confirmations/reminders to students and panelists.
7. **Execution** — Interviews happen (outside the system); outcomes logged by TPO/panel.
8. **Analytics & Reporting** — AnalyticsAgent updates readiness scores; ReportingAgent compiles the drive report; dashboard reflects final status.

---

## 9. Dashboard (TPO-facing)

Modeled on the reference dashboards but reoriented around **operations and exceptions** rather than static reporting:

- **Pending Actions** — JDs awaiting confirmation, shortlists awaiting approval, schedule conflicts to resolve
- **Live Drive Status** — stage-by-stage progress per active drive
- **Exceptions Queue** — anything ExceptionAgent flagged (data gaps, low-confidence matches, double-bookings, no-shows)
- **Analytics** — department-wise placement rate, skill-gap heatmap, readiness trends, historical drive comparisons

---

## 10. Human-in-the-Loop Control Points

| Stage | Automation does | Human decides |
|---|---|---|
| JD parsing | Extracts fields | Confirms accuracy |
| Eligibility | Filters by rules/model | Approves overrides |
| Matching | Ranks + explains | Approves/edits shortlist sent to recruiter |
| Scheduling | Proposes slots | Confirms final calendar |
| Coordination | Allocates panels/rooms | Resolves flagged conflicts |
| Selection | **Not automated at all** | Recruiter/TPO makes the call |

This separation is the core design constraint from the problem statement: the agent runs *operations*, not *decisions*.

---

## 11. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Agent services | FastAPI (Python) | Matches reference architecture; async-friendly |
| Message bus | Redis Streams | Lightweight pub/sub between agents |
| Structured DB | PostgreSQL | Relational integrity for student/drive/interview records |
| Vector store | ChromaDB / pgvector | Semantic skill–JD matching |
| ML | XGBoost (matching, eligibility scoring) + SHAP (explainability) | Proven on structured tabular placement data per reference results |
| Frontend | React dashboard | Real-time pending-actions view |
| Notifications | Email/SMS gateway + in-portal alerts | Multi-channel reach |

---

## 12. Security & Privacy
- Role-based access: student, TPO, recruiter each see only their scoped data.
- Academic and personal data encrypted at rest; recruiter access limited to shortlisted-candidate fields only.
- Audit log of every human override (who changed what, when) for institutional accountability.

---

## 13. Evaluation Metrics (for prototype validation)

| Metric | Target signal |
|---|---|
| Eligibility filtering accuracy | Agreement with manual TPO filtering on a held-out sample |
| Match ranking quality | Top-K match rate against actual shortlisted/selected students (as in reference Top-50 match rate) |
| Scheduling conflict rate | % of proposed schedules requiring manual conflict resolution |
| TPO time saved | Hours/week before vs. after (reference systems report ~80% reduction) |
| Notification reliability | Delivery/read rate |

---

## 14. Roadmap (Post-Prototype)
1. Cross-institution drive sharing (multi-college placement network).
2. Recruiter-facing portal for direct shortlist review and feedback capture (closing the loop into MatchingAgent retraining).
| Students miss updates | Fragmented, ad hoc notification channels |
| No visibility into readiness gaps | No skill-gap or analytics layer |

---

## 3. High-Level Architecture

The system follows a **hub-and-agent** model: a lightweight orchestration layer (the **Context Router**) passes a shared **Context Object** through a pipeline of specialized agents. Each agent is a stateless microservice that reads what it needs from the context, does one job well, writes its output back, and updates the routing list for the next agent(s).

```
                         ┌─────────────────────────────┐
                         │        TPO Dashboard         │
                         │  (pending actions, exceptions,│
                         │   analytics, overrides)       │
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │        Context Router          │
                         │  (creates/updates Context Obj, │
                         │   maintains agent routing list) │
                         └───────────────┬───────────────┘
        ┌────────────┬────────────┬─────┴──────┬─────────────┬────────────┐
        ▼            ▼            ▼             ▼             ▼            ▼
   JDIntake     Eligibility   Matching     Scheduling     Coordination  Notification
    Agent          Agent        Agent        Agent           Agent        Agent
        │            │            │             │             │            │
        └────────────┴─────┬──────┴─────────────┴─────────────┴────────────┘
                            ▼
                  ┌───────────────────┐
                  │  Analytics Agent   │──▶ Skill-gap & readiness scores
                  │  Reporting Agent   │──▶ Post-drive reports, dashboards
                  └───────────────────┘
                            │
                  ┌───────────────────┐
                  │   Data Layer       │
                  │ PostgreSQL (records)│
                  │ Vector DB (skills/JD)│
                  └───────────────────┘
```

All agents are independent FastAPI services connected through a message queue (Redis Streams), coordinated via a custom **Placement Context Protocol (PCP)** — a scoped adaptation of the Model Context Protocol pattern.

---

## 4. Agent Ecosystem

Nine agents cover the required prototype features. Each has a single responsibility, mirroring the "one microservice, one job" philosophy.

| # | Agent | Responsibility | Human checkpoint |
|---|---|---|---|
| 1 | **JDIntakeAgent** | Parses uploaded/company-submitted JD (PDF/text/form); extracts role, required skills, CGPA cutoff, branch eligibility, package, headcount | TPO confirms/edits extracted fields before publishing |
| 2 | **EligibilityAgent** | Runs rule-based + ML filtering against student records (CGPA, backlog history, branch, prior offer status) to produce the eligible pool | TPO can override individual exclusions |
| 3 | **MatchingAgent** | Scores each eligible student against the JD using a weighted, explainable similarity model; produces a ranked shortlist with reasons | TPO approves/adjusts shortlist before it's sent to the recruiter |
| 4 | **SchedulingAgent** | Proposes interview/test slots based on recruiter availability, room calendar, and student conflicts (e.g., overlapping drives) | TPO confirms final schedule |
| 5 | **CoordinationAgent** | Allocates panels (interviewer availability) and rooms/venues (physical or virtual link); resolves double-bookings | TPO resolves flagged conflicts |
| 6 | **NotificationAgent** | Sends eligibility results, schedule updates, and reminders to students and panel members via email/SMS/portal | Auto-sends only pre-approved templates; escalates anomalies |
| 7 | **AnalyticsAgent** | Computes skill-gap scores, placement-readiness index, department/batch trends | Read-only, feeds dashboard |
| 8 | **ReportingAgent** | Generates post-drive reports (offers, conversion rate, no-shows) for accreditation/institutional use | TPO exports/shares |
| 9 | **ExceptionAgent** | Watches the pipeline for anomalies — unresolved conflicts, missing data, low match confidence — and surfaces them as dashboard action items | Central to human-in-the-loop control |

This is intentionally leaner than Resume AI's 14-agent system: campus placement *operations* needs coordination and logistics agents (scheduling, panels, rooms) rather than resume-generation or GitHub-analysis agents, which belong to a separate candidate-facing product.

---

## 5. Data Model

A structured dataset, **Placement Operations Dataset (POD)**, underpins eligibility and matching, following the CCP-PAD pattern from the reference literature.

**Student record**
- Academic: 10th %, 12th %, CGPA, semester-wise marks, backlog history
- Skills: declared skills, proficiency levels, certifications, project tags
- Placement status: applied drives, current best offer, interview history
- Derived: **Academic Performance Index (API)**, **Skill Strength Index (SSI)**, **Placement Readiness Score (PRS)**

**Job/Drive record**
- Company, role, required skills (mandatory vs. preferred), eligibility cutoffs, package band, headcount, drive stage schedule

**Interview record**
- Panel members, room/link, time slot, student list, status (scheduled/completed/no-show), outcome (pending human entry)

Storage: **PostgreSQL** for structured records (students, drives, interviews); a **vector store** (e.g., ChromaDB/pgvector) for semantic embeddings of skills/JD text used in matching.

---

## 6. ML Components

### 6.1 Eligibility Filtering
Rule-based hard filters (CGPA cutoff, branch, backlog) run first — deterministic and auditable, since eligibility must be explainable and contestable. This deliberately avoids "black-box eligibility," unlike pure ML gating.

### 6.2 Candidate–JD Matching Score
Inspired by the multi-signal fit score in the reference systems:

```
M = w1·S_skill + w2·S_academic + w3·S_project + w4·S_readiness
```

- `S_skill` — overlap between JD required/preferred skills and student skill set (weighted, required > preferred)
- `S_academic` — normalized API against the JD's academic bar
- `S_project` — relevance of project/certification tags to role domain
- `S_readiness` — PRS, capturing mock-interview performance and completed prep milestones (if available)

Weights are tuned via a gradient-boosted model (XGBoost) trained on historical shortlisting/offer outcomes, following the same architecture pattern validated in the reference paper (binary logistic objective for "shortlisted/not," regression objective for expected package). **Every score ships with a feature-importance breakdown** so the TPO sees *why* a student ranked where they did — this is the "explanations" requirement from the problem statement, and it directly addresses the "black-box ATS" criticism raised in the second reference paper.

### 6.3 Skill-Gap & Readiness Analytics
For students not matching current drives, the AnalyticsAgent computes a gap vector (missing skills vs. most-demanded skills across recent drives) and a readiness trendline, surfaced to both the student and TPO.

---

## 7. Placement Context Protocol (PCP)

Adapted from the MCP pattern in the Resume AI reference:

- **Context Object**: `{ drive_id, task_id, session_id, payload: {}, routing: [] }`
- **Payload as shared notebook**: JDIntakeAgent writes parsed JD fields; EligibilityAgent reads them and writes the eligible pool; MatchingAgent reads the pool and writes the ranked shortlist — no agent re-queries the database for another agent's output.
- **Routing list**: each agent declares which agent(s) run next, so agents stay decoupled and the pipeline can branch (e.g., ExceptionAgent can re-route back to CoordinationAgent on a conflict).
- **Idempotency**: each task has a unique ID; duplicate messages (queue retries) are detected and skipped.
- **Human-override hooks**: every payload write includes a `requires_approval` flag; the Context Router pauses the pipeline at that node until the TPO dashboard records an approve/edit action.

---

## 8. End-to-End Workflow

1. **JD Intake** — Recruiter/TPO submits JD → JDIntakeAgent extracts structured fields → TPO confirms.
2. **Eligibility** — EligibilityAgent filters POD against JD criteria → eligible pool generated → exceptions (e.g., borderline CGPA) flagged for TPO review.
3. **Matching & Ranking** — MatchingAgent scores eligible pool → ranked, explained shortlist → TPO approves or edits.
4. **Scheduling** — SchedulingAgent proposes slots avoiding student/panel conflicts → TPO confirms.
5. **Coordination** — CoordinationAgent locks panels and rooms/links → ExceptionAgent flags double-bookings.
6. **Notification** — NotificationAgent sends confirmations/reminders to students and panelists.
7. **Execution** — Interviews happen (outside the system); outcomes logged by TPO/panel.
8. **Analytics & Reporting** — AnalyticsAgent updates readiness scores; ReportingAgent compiles the drive report; dashboard reflects final status.

---

## 9. Dashboard (TPO-facing)

Modeled on the reference dashboards but reoriented around **operations and exceptions** rather than static reporting:

- **Pending Actions** — JDs awaiting confirmation, shortlists awaiting approval, schedule conflicts to resolve
- **Live Drive Status** — stage-by-stage progress per active drive
- **Exceptions Queue** — anything ExceptionAgent flagged (data gaps, low-confidence matches, double-bookings, no-shows)
- **Analytics** — department-wise placement rate, skill-gap heatmap, readiness trends, historical drive comparisons

---

## 10. Human-in-the-Loop Control Points

| Stage | Automation does | Human decides |
|---|---|---|
| JD parsing | Extracts fields | Confirms accuracy |
| Eligibility | Filters by rules/model | Approves overrides |
| Matching | Ranks + explains | Approves/edits shortlist sent to recruiter |
| Scheduling | Proposes slots | Confirms final calendar |
| Coordination | Allocates panels/rooms | Resolves flagged conflicts |
| Selection | **Not automated at all** | Recruiter/TPO makes the call |

This separation is the core design constraint from the problem statement: the agent runs *operations*, not *decisions*.

---

## 11. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Agent services | FastAPI (Python) | Matches reference architecture; async-friendly |
| Message bus | Redis Streams | Lightweight pub/sub between agents |
| Structured DB | PostgreSQL | Relational integrity for student/drive/interview records |
| Vector store | ChromaDB / pgvector | Semantic skill–JD matching |
| ML | XGBoost (matching, eligibility scoring) + SHAP (explainability) | Proven on structured tabular placement data per reference results |
| Frontend | React dashboard | Real-time pending-actions view |
| Notifications | Email/SMS gateway + in-portal alerts | Multi-channel reach |

---

## 12. Security & Privacy
- Role-based access: student, TPO, recruiter each see only their scoped data.
- Academic and personal data encrypted at rest; recruiter access limited to shortlisted-candidate fields only.
- Audit log of every human override (who changed what, when) for institutional accountability.

---

## 13. Evaluation Metrics (for prototype validation)

| Metric | Target signal |
|---|---|
| Eligibility filtering accuracy | Agreement with manual TPO filtering on a held-out sample |
| Match ranking quality | Top-K match rate against actual shortlisted/selected students (as in reference Top-50 match rate) |
| Scheduling conflict rate | % of proposed schedules requiring manual conflict resolution |
| TPO time saved | Hours/week before vs. after (reference systems report ~80% reduction) |
| Notification reliability | Delivery/read rate |

---

## 14. Roadmap (Post-Prototype)
1. Cross-institution drive sharing (multi-college placement network).
2. Recruiter-facing portal for direct shortlist review and feedback capture (closing the loop into MatchingAgent retraining).
3. Voice/chat assistant for students to check status ("campus Alexa" pattern).
4. Federated learning across institutions to improve matching without centralizing raw student data.

---

## 15. Summary

This design keeps the two strongest ideas from the reference work — **ML-driven, explainable ranking** and **decoupled multi-agent orchestration** — and re-targets them at the actual bottleneck named in the problem statement: not resume screening, but the *operational coordination* of eligibility, matching, scheduling, and communication, with the TPO retaining full control over every judgment call.

---

## 16. Getting Started (Separate Frontend & Backend)

The project is structured as a separate frontend and backend layout:

### 16.1 Backend Setup (FastAPI)
Run from the root workspace directory:
```bash
# Set PYTHONPATH and start the FastAPI dev server
$env:PYTHONPATH="." ; .venv\Scripts\python -m uvicorn backend.main:app --port 8000
```
* Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* Database seed script (if needed):
  ```bash
  $env:PYTHONPATH="." ; .venv\Scripts\python backend/seed.py
  ```

### 16.2 Frontend Setup (Next.js)
Navigate to the `frontend/` directory:
```bash
cd frontend
npm run dev
```
* Dashboard URL: [http://localhost:3000](http://localhost:3000)

---

## 17. Authentication (Supabase)

Sign up / sign in / OAuth is now handled directly by **Supabase Auth** on the frontend (no custom JWT auth needed for login). This replaces the earlier mock/localStorage login.

### 17.1 One-time Supabase project setup
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of `frontend/supabase/schema.sql`, and run it. This creates a `profiles` table (role: `student` / `recruiter` / `tpo`, plus name, branch, cgpa, and readiness scores), enables Row Level Security, and adds a trigger that auto-creates a profile the moment a new auth user is created.
3. (Optional, for social login) In **Authentication → Providers**, enable **Google**, **GitHub**, and/or **LinkedIn (OIDC)**, and fill in each provider's client ID/secret.
4. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (or your deployed URL)
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
5. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

### 17.2 Wire up the frontend
```bash
cd frontend
cp .env.local.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
Restart `npm run dev`. The login screen will show **Sign In / Sign Up**, three role cards (Student / Recruiter / TPO), Google/LinkedIn/GitHub buttons, and an email+password form — all backed by real Supabase accounts and sessions (`supabase.auth`), with the resulting role/profile stored in the `profiles` table.

If `.env.local` is left unset, the app falls back to **Quick Demo Login** (sample data, no real account) so the UI stays explorable without a Supabase project.

### 17.3 What changed
- `frontend/lib/supabase.ts` — Supabase client configured for the PKCE OAuth flow.
- `frontend/lib/auth.ts` — `signUpWithEmail`, `signInWithEmail`, `signInWithOAuth`, `signOut`, `getProfile`, `ensureProfile`.
- `frontend/app/page.tsx` — `Page` now restores/observes the Supabase session (`onAuthStateChange`) instead of reading a custom token from `localStorage`; `LoginGate` now calls Supabase directly instead of the FastAPI `/auth/*` endpoints.
- `frontend/app/auth/callback/page.tsx` — completes the OAuth redirect with `supabase.auth.exchangeCodeForSession(...)` and provisions the `profiles` row.
- `frontend/supabase/schema.sql` — the `profiles` table, RLS policies, and auto-provisioning trigger.

> Note: the FastAPI backend's `/auth/*` routes and custom JWT are unchanged and still available if you want to keep the backend as the source of truth for placement data (drives, eligibility, matching, etc.) — only sign-up/sign-in now goes through Supabase.

## 18. UI Polish
Added micro-interactions across the dashboard: staggered card/row reveal on every screen change, hover-lift on panels/metric cards/agent cards, button press feedback, focus glow on form inputs, and a shake animation on auth errors — all respecting `prefers-reduced-motion`.
