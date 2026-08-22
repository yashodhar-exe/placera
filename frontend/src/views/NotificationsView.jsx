import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Bell, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Check, 
  History,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function NotificationsView({ 
  selectedDriveId, 
  drives = [] 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Broadcast Composer State
  const [targetGroup, setTargetGroup] = useState('ALL_ELIGIBLE'); // ALL_ELIGIBLE, SHORTLISTED, SCHEDULED_CANDIDATES
  const [channels, setChannels] = useState(['PORTAL', 'EMAIL']);
  const [templateType, setTemplateType] = useState('ELIGIBILITY_ANNOUNCEMENT');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  useEffect(() => {
    loadNotifications();
  }, [activeDrive?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNotifications(activeDrive?.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChannel = (ch) => {
    setChannels(prev => 
      prev.includes(ch) ? (prev.length > 1 ? prev.filter(c => c !== ch) : prev) : [...prev, ch]
    );
  };

  const handleDispatchBroadcast = async (e) => {
    e.preventDefault();
    if (!activeDrive) return;
    try {
      setSending(true);
      const res = await apiClient.broadcastNotification({
        drive_id: activeDrive.id,
        target_group: targetGroup,
        channels: channels,
        template_type: templateType,
        custom_subject: customSubject || undefined,
        custom_message: customMessage || undefined,
        actor_id: 'TPO_ADMIN'
      });
      setSuccessMsg(`Successfully dispatched ${res.dispatched_count} notifications via ${channels.join(' & ')}!`);
      await loadNotifications();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Broadcast failed', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            NotificationAgent
          </span>
          <span className="text-xs text-slate-400 font-mono">Multi-Channel Templated Dispatcher</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mt-1">Placement Broadcast & Notifications</h1>
        <p className="text-xs text-slate-400">
          Dispatches approved announcements, interview call letters, reminders, and hall tickets with strict safety templates.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Broadcast Composer (7 cols) + Dispatch History (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Composer Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleDispatchBroadcast} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-400" />
                Dispatch New Placement Broadcast
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                {activeDrive?.company?.name || 'Drive'}
              </span>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Target Recipient Pool *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL_ELIGIBLE', label: 'All Eligible Pool' },
                  { id: 'SHORTLISTED', label: 'Shortlisted Only' },
                  { id: 'SCHEDULED_CANDIDATES', label: 'Scheduled Only' }
                ].map((tg) => (
                  <button
                    key={tg.id}
                    type="button"
                    onClick={() => setTargetGroup(tg.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      targetGroup === tg.id
                        ? 'bg-sky-600/20 text-sky-300 border-sky-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Delivery Channels *</label>
              <div className="flex gap-3">
                {[
                  { id: 'PORTAL', label: 'Student Portal', icon: Bell },
                  { id: 'EMAIL', label: 'Official Email', icon: Mail },
                  { id: 'SMS', label: 'SMS Gateway', icon: MessageSquare }
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleToggleChannel(ch.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Message Template Type</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="ELIGIBILITY_ANNOUNCEMENT">Eligibility Announcement & Pool Release</option>
                <option value="SHORTLIST_ANNOUNCEMENT">Candidate Shortlist Call Letter</option>
                <option value="SCHEDULE_REMINDER">Interview Slot Reminder with Room Venue</option>
                <option value="CUSTOM_BROADCAST">Custom Placement Broadcast Notice</option>
              </select>
            </div>

            {/* Custom Fields (if needed) */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Subject (Optional)</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={`Important: ${activeDrive?.company?.name || 'Company'} Recruitment Drive Update`}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Message Body (Optional)</label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Dear {Name}, you have been selected for {Company} round..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-sans"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> TPO Authorized Broadcast
              </span>

              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dispatch History (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              Recent Dispatch Log
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{notifications.length} Sent</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-slate-500 italic text-center py-12 text-xs">
                No notifications logged for this drive yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{n.recipient_name || n.recipient_contact}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-sky-400 border border-slate-700">
                      {n.channel}
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium text-[11px] line-clamp-1">{n.subject}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.message_body}</p>
                  <div className="text-[9px] text-slate-500 font-mono pt-1">
                    {new Date(n.sent_at).toLocaleString()} • Status: <span className="text-emerald-400 font-bold">{n.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
