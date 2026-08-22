const API_BASE = '/api';

export const apiClient = {
  // Drives
  getDrives: async (stage) => {
    const url = stage ? `${API_BASE}/drives?stage=${stage}` : `${API_BASE}/drives`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch drives');
    return res.json();
  },
  getDriveById: async (driveId) => {
    const res = await fetch(`${API_BASE}/drives/${driveId}`);
    if (!res.ok) throw new Error('Failed to fetch drive');
    return res.json();
  },
  parseJD: async (data) => {
    const res = await fetch(`${API_BASE}/drives/parse_jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to parse JD');
    return res.json();
  },
  createDrive: async (data) => {
    const res = await fetch(`${API_BASE}/drives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create drive');
    return res.json();
  },
  updateDrive: async (driveId, data) => {
    const res = await fetch(`${API_BASE}/drives/${driveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update drive');
    return res.json();
  },
  advanceStage: async (driveId, targetStage, notes) => {
    const res = await fetch(`${API_BASE}/drives/${driveId}/advance_stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_stage: targetStage, notes }),
    });
    if (!res.ok) throw new Error('Failed to advance stage');
    return res.json();
  },

  // Students
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/students?${query}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },
  getStudentById: async (studentId) => {
    const res = await fetch(`${API_BASE}/students/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student details');
    return res.json();
  },

  // Eligibility
  getDriveEligibility: async (driveId, isEligible, branch) => {
    let url = `${API_BASE}/eligibility/drive/${driveId}`;
    const params = new URLSearchParams();
    if (isEligible !== undefined && isEligible !== null) params.append('is_eligible', isEligible);
    if (branch) params.append('branch', branch);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch eligibility');
    return res.json();
  },
  evaluateEligibility: async (driveId) => {
    const res = await fetch(`${API_BASE}/eligibility/drive/${driveId}/evaluate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to evaluate eligibility');
    return res.json();
  },
  overrideEligibility: async (driveId, studentId, isEligible, reason, actorId = 'TPO_ADMIN') => {
    const res = await fetch(`${API_BASE}/eligibility/override?drive_id=${driveId}&student_id=${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_eligible: isEligible, override_reason: reason, actor_id: actorId }),
    });
    if (!res.ok) throw new Error('Failed to override eligibility');
    return res.json();
  },

  // Matching
  getDriveMatches: async (driveId, isShortlisted, tpoStatus) => {
    let url = `${API_BASE}/matching/drive/${driveId}`;
    const params = new URLSearchParams();
    if (isShortlisted !== undefined && isShortlisted !== null) params.append('is_shortlisted', isShortlisted);
    if (tpoStatus) params.append('tpo_status', tpoStatus);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },
  generateMatches: async (driveId) => {
    const res = await fetch(`${API_BASE}/matching/drive/${driveId}/generate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate matches');
    return res.json();
  },
  shortlistAction: async (matchIds, action, notes, actorId = 'TPO_ADMIN') => {
    const res = await fetch(`${API_BASE}/matching/shortlist_action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_match_ids: matchIds,
        action,
        notes,
        actor_id: actorId,
      }),
    });
    if (!res.ok) throw new Error('Failed to update shortlist');
    return res.json();
  },

  // Scheduling & Coordination
  getDriveSchedule: async (driveId, conflictsOnly = false) => {
    const url = conflictsOnly
      ? `${API_BASE}/scheduling/drive/${driveId}?conflicts_only=true`
      : `${API_BASE}/scheduling/drive/${driveId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return res.json();
  },
  generateSchedule: async (driveId, options) => {
    const res = await fetch(`${API_BASE}/scheduling/drive/${driveId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to generate schedule');
    return res.json();
  },
  resolveScheduleConflict: async (data) => {
    const res = await fetch(`${API_BASE}/scheduling/resolve_conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to resolve schedule conflict');
    return res.json();
  },
  getPanels: async () => {
    const res = await fetch(`${API_BASE}/coordination/panels`);
    if (!res.ok) throw new Error('Failed to fetch panels');
    return res.json();
  },
  getRooms: async () => {
    const res = await fetch(`${API_BASE}/coordination/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },
  getPanelLoads: async () => {
    const res = await fetch(`${API_BASE}/coordination/panel_load`);
    if (!res.ok) throw new Error('Failed to fetch panel loads');
    return res.json();
  },

  // Exceptions
  getExceptions: async (status, severity) => {
    let url = `${API_BASE}/exceptions`;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch exceptions');
    return res.json();
  },
  scanExceptions: async () => {
    const res = await fetch(`${API_BASE}/exceptions/scan`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run exception scan');
    return res.json();
  },
  resolveException: async (exceptionId, resolutionNotes, actionTaken = 'APPLY_SUGGESTED_FIX') => {
    const res = await fetch(`${API_BASE}/exceptions/${exceptionId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution_notes: resolutionNotes,
        action_taken: actionTaken,
        actor_id: 'TPO_ADMIN',
      }),
    });
    if (!res.ok) throw new Error('Failed to resolve exception');
    return res.json();
  },

  // Analytics & KPIs
  getKPIs: async () => {
    const res = await fetch(`${API_BASE}/analytics/kpis`);
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return res.json();
  },
  getSkillGaps: async () => {
    const res = await fetch(`${API_BASE}/analytics/skill_gaps`);
    if (!res.ok) throw new Error('Failed to fetch skill gaps');
    return res.json();
  },
  getDepartmentReadiness: async () => {
    const res = await fetch(`${API_BASE}/analytics/department_readiness`);
    if (!res.ok) throw new Error('Failed to fetch department readiness');
    return res.json();
  },

  // Reports
  getDriveReport: async (driveId) => {
    const res = await fetch(`${API_BASE}/reports/drive/${driveId}`);
    if (!res.ok) throw new Error('Failed to fetch drive report');
    return res.json();
  },

  // Notifications
  getNotifications: async (driveId) => {
    const url = driveId ? `${API_BASE}/notifications?drive_id=${driveId}` : `${API_BASE}/notifications`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  broadcastNotification: async (data) => {
    const res = await fetch(`${API_BASE}/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send broadcast');
    return res.json();
  },

  uploadJDFile: async (formData) => {
    const res = await fetch(`${API_BASE}/drives/upload_jd`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload and parse JD file');
    return res.json();
  },
  updateSlotStatus: async (scheduleId, status, result, rating, feedback) => {
    const params = new URLSearchParams({ status });
    if (result) params.append('result', result);
    if (rating !== undefined && rating !== null) params.append('rating', rating);
    if (feedback) params.append('feedback', feedback);
    const res = await fetch(`${API_BASE}/scheduling/slot/${scheduleId}/status?${params.toString()}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update slot status');
    return res.json();
  },

  // Audit Logs & Live Events
  getAuditLogs: async (driveId) => {
    const url = driveId ? `${API_BASE}/audit?drive_id=${driveId}` : `${API_BASE}/audit`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
  getLiveEvents: async () => {
    const res = await fetch(`${API_BASE}/events/live`);
    if (!res.ok) throw new Error('Failed to fetch live events');
    return res.json();
  },
};
