import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { whatsappApi } from '../../api';
import { useApp } from '../../context/AppContext';

const WA_GREEN = '#25D366';
const WA_BG = '#ECE5DD';

const normalizePhone = (p) => {
  let digits = String(p || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  return digits;
};

const fmtTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const displayPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? '+' + digits : phone;
};

export default function WhatsAppThreadPage() {
  const { phone } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useApp();
  const name = location.state?.name || null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await whatsappApi.thread(phone);
      setMessages(Array.isArray(data) ? data : []);
    } catch (_) { /* polling */ }
    finally { setLoading(false); }
  }, [phone]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    setSending(true);

    const optimistic = {
      _id: 'local-' + Date.now(),
      phone: normalizePhone(phone),
      direction: 'out',
      body,
      status: 'sending',
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const doc = await whatsappApi.send({ phone, name, body });
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      if (doc) {
        setMessages((prev) => prev.some((m) => String(m._id) === String(doc._id)) ? prev : [...prev, doc]);
      }
      load();
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? { ...m, status: 'failed' } : m)));
      toast(e?.response?.data?.error || e?.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 420 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px' }}>
        <button className="btn btn-sm" onClick={() => navigate('/whatsapp')}>←</button>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: WA_GREEN + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: WA_GREEN
        }}>
          {(name || displayPhone(phone)).trim().substring(0, 1).toUpperCase()}
        </div>
        <strong>{name || displayPhone(phone)}</strong>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{
        flex: 1, background: WA_BG, borderRadius: 10, padding: 12, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 6
      }}>
        {loading ? <p className="tw" style={{ textAlign: 'center', marginTop: 40 }}>Loading…</p> :
          !messages.length ? (
            <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--mu)' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>💬</div>
              <strong>No messages yet</strong>
              <div style={{ fontSize: 13 }}>Send a message to start the conversation</div>
            </div>
          ) : messages.map((m) => (
            <Bubble key={m._id || m.wamid || JSON.stringify(m)} m={m} />
          ))}
      </div>

      {/* 24h window notice */}
      <div style={{ background: '#FFF9E6', padding: '6px 12px', fontSize: 11, color: 'var(--mu)', borderRadius: 6, marginTop: 8 }}>
        ℹ️ Free text only delivers within 24h of the customer's last message. Use templates for proactive outreach.
      </div>

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 10 }}>
        <textarea
          className="inp"
          rows={1}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{ flex: 1, resize: 'none', maxHeight: 120 }}
          maxLength={1000}
        />
        <button
          className="btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{ background: WA_GREEN, color: '#fff', flexShrink: 0, height: 42, minWidth: 48 }}
        >
          {sending ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}

function Bubble({ m }) {
  const mine = m.direction === 'out';
  const failed = m.status === 'failed';
  const isTemplate = m.kind === 'template';
  const read = m.status === 'read';
  const delivered = m.status === 'delivered' || m.status === 'sent';

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '78%', padding: '8px 12px', borderRadius: 12,
        background: mine ? '#DCF8C6' : '#fff',
        borderBottomRightRadius: mine ? 3 : 12,
        borderBottomLeftRadius: mine ? 12 : 3,
        boxShadow: mine ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        {isTemplate && !m.body ? (
          <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--mu)' }}>
            Sent template: {m.templateName || 'message'}
          </span>
        ) : (
          <span style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</span>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--mu)' }}>{fmtTime(m.createdAt)}</span>
          {mine && (
            <span style={{ fontSize: 11, color: failed ? '#EF4444' : read ? '#34B7F1' : delivered ? 'var(--mu)' : 'var(--mu)' }}>
              {failed ? '⚠️' : read ? '✓✓' : delivered ? '✓✓' : '🕐'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
