/**
 * Shared bits for the Customer Success pages: health labels, time formatting,
 * contact links and the nudge (push notification) form.
 */
import { useState } from 'react';

export const HEALTH = {
  active: { label: 'Active', badge: 'bbg', color: 'var(--G)', hint: 'Used Tapify in the last 7 days' },
  slipping: { label: 'Slipping', badge: 'bba', color: 'var(--A)', hint: 'Last active 8–21 days ago' },
  quiet: { label: 'Gone quiet', badge: 'bbr', color: 'var(--R)', hint: 'No activity for over 21 days' },
  never_started: { label: 'Never started', badge: 'bbgr', color: 'var(--mu)', hint: 'Has never logged in' },
};

export function HealthBadge({ health }) {
  const h = HEALTH[health] || HEALTH.never_started;
  return <span className={`badge ${h.badge}`} title={h.hint}>{h.label}</span>;
}

/** "3h ago", "12d ago", "—" */
export function ago(d) {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 60) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 30))}mo ago`;
}

export const dateTime = (d) => (d
  ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—');

export const dateOnly = (d) => (d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');

/** Indian mobile numbers are stored without a country code; WhatsApp needs one. */
function waDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
export const whatsappUrl = (phone, text = '') =>
  `https://wa.me/${waDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const telUrl = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

export const errorText = (e, fallback) => e?.response?.data?.error || e?.response?.data?.message || fallback;

// ───────────────────── audience (what their customers did) ─────────────────

/** How a visitor arrived, in words a manager can repeat on a call. */
export const SOURCES = {
  nfc: { label: 'NFC card tapped', short: 'NFC tap', icon: '📇' },
  qr: { label: 'QR code scanned', short: 'QR scan', icon: '🔳' },
  whatsapp: { label: 'Link opened from WhatsApp', short: 'WhatsApp', icon: '💬' },
  social: { label: 'Link opened from social media', short: 'Social', icon: '📱' },
  search: { label: 'Found on Google', short: 'Google', icon: '🔍' },
  link: { label: 'Link from another website', short: 'Other site', icon: '🔗' },
  direct: { label: 'Opened the link directly', short: 'Direct link', icon: '↗️' },
};

/** What each recorded event means. */
export const EVENTS = {
  view: 'Opened',
  scan: 'Scanned',
  tap_call: 'Tapped Call',
  tap_whatsapp: 'Tapped WhatsApp',
  tap_email: 'Tapped Email',
  tap_save_contact: 'Saved the contact',
  tap_directions: 'Tapped directions',
  tap_share: 'Shared it',
  tap_social: 'Tapped a social link',
  tap_link: 'Tapped a link',
  tap_qr_download: 'Downloaded the QR',
  tap_book: 'Tapped Book',
  tap_order: 'Tapped Order',
  tap_pay: 'Tapped Pay',
  inquiry: 'Sent an enquiry',
  appointment: 'Booked an appointment',
  order: 'Placed an order',
  redirect_google: 'Sent on to Google to review',
  review_submitted: 'Left a review',
};
export const eventLabel = (e) => EVENTS[e] || String(e || '').replace(/_/g, ' ');

export const ASSETS = {
  card: 'Digital card',
  site: 'Website',
  store: 'WhatsApp store',
  qr: 'QR code',
  review_card: 'Google review card',
};
export const assetLabel = (a) => ASSETS[a] || a;

export const num = (n) => (Number(n) || 0).toLocaleString('en-IN');

/** Local datetime-local input value → ISO string (the browser's own time zone). */
export const localInputToIso = (v) => (v ? new Date(v).toISOString() : null);

/** Push notification into the customer's Tapify app. */
export function NudgeForm({ client, catalog, onSend, onCancel }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feature, setFeature] = useState('');
  const [sending, setSending] = useState(false);

  const templates = [
    { t: 'Your leads are waiting 📩', m: 'You have new inquiries in Tapify. Reply quickly to win the customer!', f: 'inquiries' },
    { t: 'Festive designs are ready 🎨', m: 'Ready-made designs for your business are waiting. Customise and share one today.', f: 'designs' },
    { t: 'Get found on Google 🔎', m: 'Connect your Google Business Profile in Tapify so more customers find you.', f: 'google_business' },
    { t: 'Your website is almost live 🌐', m: 'Publish your Tapify website in one tap and start getting enquiries online.', f: 'website_builder' },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend({ title: title.trim(), message: message.trim(), feature });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="mh">
        <h3>Send a nudge to {client.name}</h3>
        <button type="button" className="btn btn-sm" onClick={onCancel}>✕</button>
      </div>
      {!client.app?.installed && (
        <div className="card2" style={{ marginBottom: 10, fontSize: 12, color: 'var(--A)' }}>
          This customer hasn't installed the app, so it won't reach their phone. They'll see it in
          their notifications the next time they open Tapify.
        </div>
      )}
      <div className="ds">
        <div className="ds-title">Quick templates</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {templates.map((x) => (
            <button key={x.t} type="button" className="btn btn-xs" onClick={() => { setTitle(x.t); setMessage(x.m); setFeature(x.f); }}>
              {x.t}
            </button>
          ))}
        </div>
      </div>
      <div className="fg">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </div>
      <div className="fg">
        <label>Message</label>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} required />
      </div>
      <div className="fg">
        <label>When they tap it, open</label>
        <select value={feature} onChange={(e) => setFeature(e.target.value)}>
          <option value="">The app's home screen</option>
          {(catalog || []).filter((f) => f.key !== 'app').map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-p btn-sm" disabled={sending}>{sending ? 'Sending…' : 'Send nudge'}</button>
      </div>
    </form>
  );
}

/** Log a call / WhatsApp / note, optionally with a follow-up reminder. */
export function ContactForm({ client, initialType = 'call', onSave, onCancel }) {
  const [type, setType] = useState(initialType);
  const [text, setText] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  const quick = (days) => {
    const d = new Date(Date.now() + days * 86400000);
    d.setHours(11, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    setFollowUp(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ type, text: text.trim(), followUpAt: localInputToIso(followUp) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="mh">
        <h3>Log contact — {client.name}</h3>
        <button type="button" className="btn btn-sm" onClick={onCancel}>✕</button>
      </div>
      <div className="fg">
        <label>What happened</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['call', '📞 Call'], ['whatsapp', '💬 WhatsApp'], ['note', '📝 Note']].map(([k, l]) => (
            <button key={k} type="button" className={`btn btn-sm ${type === k ? 'btn-p' : ''}`} onClick={() => setType(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="fg">
        <label>Notes</label>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
          placeholder="e.g. Helped them log in; they'll try Designs this week" />
      </div>
      <div className="fg">
        <label>Follow up (optional — you'll get a reminder)</label>
        <input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button type="button" className="btn btn-xs" onClick={() => quick(1)}>Tomorrow 11am</button>
          <button type="button" className="btn btn-xs" onClick={() => quick(3)}>In 3 days</button>
          <button type="button" className="btn btn-xs" onClick={() => quick(7)}>Next week</button>
          {followUp && <button type="button" className="btn btn-xs btn-r" onClick={() => setFollowUp('')}>Clear</button>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-p btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
