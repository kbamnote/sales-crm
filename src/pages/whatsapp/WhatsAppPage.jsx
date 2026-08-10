import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { whatsappApi } from '../../api';
import { useApp } from '../../context/AppContext';

const WA_GREEN = '#25D366';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'card', label: '🚀 Card' },
  { key: 'demo', label: '📅 Demo' },
  { key: 'support', label: '🛟 Support' },
];

const fmtTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const displayPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? '+' + digits : phone;
};

export default function WhatsAppPage() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await whatsappApi.conversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (_) { /* silent — polling */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = filter === 'all' ? conversations : conversations.filter((c) => c.requestType === filter);
  const countFor = (key) => (key === 'all' ? conversations.length : conversations.filter((c) => c.requestType === key).length);

  return (
    <div>
      <h3 style={{ margin: '0 0 12px' }}>WhatsApp Inbox</h3>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="btn btn-sm"
              style={active ? { background: WA_GREEN, color: '#fff', borderColor: WA_GREEN } : undefined}
            >
              {f.label} <span style={{ opacity: 0.8, fontSize: 11 }}>{countFor(f.key)}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="tw" style={{ padding: 40, textAlign: 'center' }}>Loading…</p>
      ) : !filtered.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
          <strong>{filter === 'all' ? 'No conversations yet' : 'None in this filter'}</strong>
          <p style={{ color: 'var(--mu)', fontSize: 13, maxWidth: 380, margin: '8px auto 0' }}>
            {filter === 'all'
              ? 'Messages you send from a lead or client, and replies from customers, will appear here.'
              : 'No conversations match this category yet.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          {filtered.map((c) => {
            const phone = c.phone || c._id;
            const title = c.name || displayPhone(phone);
            const preview = c.lastMessage || '';
            const outbound = c.lastDirection === 'out';
            const unread = Number(c.unread) || 0;
            const initial = (c.name || displayPhone(phone) || '#').trim().substring(0, 1).toUpperCase();
            return (
              <button
                key={phone}
                onClick={() => navigate('/whatsapp/thread/' + encodeURIComponent(phone))}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: WA_GREEN + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: WA_GREEN, flexShrink: 0
                }}>
                  {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</strong>
                    <span style={{ fontSize: 11, color: unread ? WA_GREEN : 'var(--mu)', fontWeight: unread ? 700 : 400 }}>
                      {fmtTime(c.updatedAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {outbound && <span style={{ fontSize: 12, color: 'var(--mu)' }}>↗</span>}
                    <span style={{
                      flex: 1, fontSize: 13, color: unread ? 'var(--tx)' : 'var(--mu)',
                      fontWeight: unread ? 500 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {preview || 'No messages'}
                    </span>
                    {unread > 0 && (
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: 10, background: WA_GREEN, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, padding: '0 6px'
                      }}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
