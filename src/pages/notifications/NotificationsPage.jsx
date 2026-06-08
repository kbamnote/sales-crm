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

  useEffect(() => {
    usersApi.list()
      .then((r) => setEmployees(r.data || []))
      .catch(() => toast('Failed to load employees'));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!toUser) return toast('Select an employee');
    if (!title.trim() || !message.trim()) return toast('Title and message are required');
    setSending(true);
    try {
      await notifsApi.send({ to: toUser, title: title.trim(), msg: message.trim(), type: 'system' });
      const name = employees.find((u) => u._id === toUser)?.name || 'employee';
      toast(`Notification sent to ${name}`);
      setTitle('');
      setMessage('');
      setToUser('');
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

      {/* Send a notification to a particular employee */}
      <form
        onSubmit={handleSend}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
          padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        <strong style={{ fontSize: 14 }}>Send Notification</strong>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-sm" disabled={sending}>
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      </form>

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
