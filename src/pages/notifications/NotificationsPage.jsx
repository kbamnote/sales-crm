import { useState, useEffect } from 'react';
import { notifsApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fdt } from '../../utils/helpers';

export default function NotificationsPage() {
  const { toast } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  // Compose-and-send state
  const [employees, setEmployees] = useState([]);
  const [toUser, setToUser] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('individual'); // 'individual' | 'broadcast'
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduledNotifs, setScheduledNotifs] = useState([]);

  useEffect(() => {
    usersApi.list()
      .then((r) => setEmployees(r.data || []))
      .catch(() => toast('Failed to load employees'));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (mode === 'individual' && !toUser) return toast('Select an employee');
    if (!title.trim() || !message.trim()) return toast('Title and message are required');
    if (scheduleOn && !scheduleDate) return toast('Select a schedule date');
    
    setSending(true);
    try {
      const payload = {
        to: mode === 'broadcast' ? 'all' : toUser,
        title: title.trim(),
        msg: message.trim(),
        type: 'system',
        toName: mode === 'broadcast' ? 'All Employees' : employees.find((u) => u._id === toUser)?.name || ''
      };
      if (scheduleOn) {
        payload.scheduledAt = new Date(scheduleDate).toISOString();
      }
      
      await notifsApi.send(payload);
      
      const targetName = mode === 'broadcast' ? 'all employees' : (employees.find((u) => u._id === toUser)?.name || 'employee');
      toast(scheduleOn ? `Notification scheduled for ${targetName}` : `Notification sent to ${targetName}`);
      
      setTitle('');
      setMessage('');
      setToUser('');
      setScheduleOn(false);
      setScheduleDate('');
      load();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await notifsApi.list(filterUnread ? true : undefined);
      setNotifications(r.data);
      try {
        const s = await notifsApi.listScheduled();
        setScheduledNotifs(s.data);
      } catch (err) { /* ignore if user lacks role */ }
    } catch (e) {
      toast('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterUnread]);

  const handleMarkRead = async (id) => {
    try {
      await notifsApi.markRead(id);
      load();
    } catch (e) { toast('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifsApi.markAllRead();
      toast('All marked as read');
      load();
    } catch (e) { toast('Failed to mark all as read'); }
  };

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled notification?')) return;
    try {
      await notifsApi.cancelScheduled(id);
      toast('Scheduled notification cancelled');
      load();
    } catch (e) {
      toast('Failed to cancel scheduled notification');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Notifications</h2>
        <div style={{ flex: 1 }}></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <input 
            type="checkbox" 
            checked={filterUnread} 
            onChange={e => setFilterUnread(e.target.checked)} 
          />
          Show Unread Only
        </label>
        <button className="btn btn-sm" onClick={handleMarkAllRead}>Mark All as Read</button>
      </div>

      {/* Send / Broadcast Notification */}
      <form
        onSubmit={handleSend}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
          padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <strong style={{ fontSize: 14 }}>Compose Notification</strong>
          <div style={{ display: 'flex', gap: 15, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="radio" name="notifMode" checked={mode === 'individual'} onChange={() => setMode('individual')} /> Specific Employee
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="radio" name="notifMode" checked={mode === 'broadcast'} onChange={() => setMode('broadcast')} /> Broadcast to All
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {mode === 'individual' && (
            <select
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              style={{ flex: '1 1 220px', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              <option value="">Select employee…</option>
              {employees.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}{u.role ? ` — ${u.role}` : ''}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            style={{ flex: '1 1 220px', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={300}
          style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={scheduleOn} onChange={(e) => setScheduleOn(e.target.checked)} /> Schedule for later
            </label>
            {scheduleOn && (
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{ padding: 6, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            )}
          </div>
          <button type="submit" className="btn btn-sm" disabled={sending}>
            {sending ? 'Processing…' : (scheduleOn ? 'Schedule Notification' : 'Send Notification')}
          </button>
        </div>
      </form>

      {/* Scheduled Notifications */}
      {scheduledNotifs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Upcoming Scheduled</h3>
          <div className="tw" style={{ background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            {scheduledNotifs.map(sn => (
              <div key={sn._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: 14 }}>{sn.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
                    To: {sn.to === 'all' ? 'All Employees' : sn.toName || sn.to} &middot; Scheduled for: {fdt(sn.scheduledAt)}
                  </div>
                </div>
                <button className="btn btn-xs" style={{ background: 'var(--danger, #ef4444)', color: '#fff', border: 'none' }} onClick={() => handleCancelScheduled(sn._id)}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tw" style={{ background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu)' }}>No notifications</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <div 
                key={n._id} 
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : 'rgba(var(--p-rgb), 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                    <span style={{ fontSize: 11, color: 'var(--mu)' }}>{fdt(n.ts || n.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{n.msg}</div>
                </div>
                {!n.read && (
                  <button 
                    className="btn btn-xs" 
                    onClick={() => handleMarkRead(n._id)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
