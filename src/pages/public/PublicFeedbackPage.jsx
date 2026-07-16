import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import publicApi from '../../api/publicClient';

const BRAND = '#153e3f';
const RATINGS = [
  { label: 'Excellent', value: 5 },
  { label: 'Very Good', value: 4 },
  { label: 'Good', value: 3 },
  { label: 'Average', value: 2 },
  { label: 'Needs Improvement', value: 1 },
];

export default function PublicFeedbackPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState('');
  const [alreadyDone, setAlreadyDone] = useState(false);

  const [kitExplained, setKitExplained] = useState(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    publicApi.get(`/public/fulfillment/${token}`)
      .then((r) => {
        setClientName(r.data.clientName || '');
        setAlreadyDone(r.data.feedbackSubmitted);
      })
      .catch((e) => setError(e.response?.data?.error || 'This link is not valid.'))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (kitExplained === null) return alert('Please tell us if the kit was explained.');
    if (!rating) return alert('Please rate your overall experience.');
    setSubmitting(true);
    try {
      await publicApi.post(`/public/fulfillment/${token}/feedback`, { kitExplained, rating, notes });
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Could not submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Shell><p style={s.muted}>Loading…</p></Shell>;
  if (error) return <Shell><p style={s.error}>{error}</p></Shell>;
  if (done || alreadyDone) {
    return <Shell><div style={{ textAlign: 'center', padding: '30px 0' }}>
      <div style={{ fontSize: 46 }}>🙏</div>
      <h2 style={{ color: BRAND, margin: '12px 0 6px' }}>Thank you!</h2>
      <p style={s.muted}>We appreciate your feedback{clientName ? ', ' + clientName : ''}.</p>
    </div></Shell>;
  }

  return (
    <Shell>
      <h1 style={s.h1}>How was your experience?</h1>
      <p style={s.sub}>Your feedback helps us serve you better. It only takes a minute.</p>

      <div style={s.field}>
        <label style={s.label}>Did our team explain how to use your kit?</label>
        <div style={s.pillRow}>
          {[['Yes', true], ['No', false]].map(([lbl, val]) => (
            <button key={lbl} type="button" onClick={() => setKitExplained(val)}
              style={{ ...s.pill, ...(kitExplained === val ? s.pillOn : {}) }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Overall Experience</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RATINGS.map((r) => (
            <button key={r.value} type="button" onClick={() => setRating(r.value)}
              style={{ ...s.rate, ...(rating === r.value ? s.rateOn : {}) }}>{r.label}</button>
          ))}
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Feedback / Suggestions</label>
        <textarea style={{ ...s.input, height: 90, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like us to know…" />
      </div>

      <button style={{ ...s.submit, opacity: submitting ? 0.6 : 1 }} onClick={submit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brandBar}>TAPIFY</div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#eef1f2', display: 'flex', justifyContent: 'center', padding: '24px 12px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  card: { width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' },
  brandBar: { background: BRAND, color: '#fff', fontWeight: 800, letterSpacing: 2, fontSize: 18, padding: '16px 22px' },
  h1: { color: BRAND, fontSize: 22, margin: '0 0 6px' },
  sub: { color: '#556', fontSize: 14, margin: '0 0 18px', lineHeight: 1.5 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#334', marginBottom: 8 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d5dbe0', borderRadius: 10, padding: '11px 12px', fontSize: 15, color: '#223', outlineColor: BRAND },
  pillRow: { display: 'flex', gap: 8 },
  pill: { border: '1px solid #d5dbe0', background: '#fff', color: '#334', borderRadius: 999, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  pillOn: { background: BRAND, color: '#fff', borderColor: BRAND },
  rate: { border: '1px solid #d5dbe0', background: '#fff', color: '#334', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' },
  rateOn: { background: BRAND, color: '#fff', borderColor: BRAND },
  submit: { width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  muted: { color: '#778', fontSize: 14 },
  error: { color: '#c0392b', fontSize: 15, textAlign: 'center', padding: '20px 0' },
};
