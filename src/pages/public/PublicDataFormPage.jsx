import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import publicApi from '../../api/publicClient';

const CLOUD_NAME = 'dpreeciaf';
const UPLOAD_PRESET = 'salescrm_attendance';
const BRAND = '#153e3f';

const FIELDS = [
  { key: 'businessName', label: 'Business Name', required: true },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'businessPhone', label: 'Business Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'whatsapp', label: 'WhatsApp Number', type: 'tel' },
  { key: 'address', label: 'Business Address', textarea: true },
  { key: 'googleReviewLink', label: 'Google Map / Review Link' },
  { key: 'instagram', label: 'Instagram Profile Link' },
  { key: 'facebook', label: 'Facebook Page Link' },
  { key: 'productList', label: 'Product List', textarea: true },
  { key: 'servicesList', label: 'Services List', textarea: true },
  { key: 'businessHours', label: 'Business Hours' },
];

const SOCIALS = [
  { key: 'hasGoogleBusiness', label: 'Do you have a Google Business profile?' },
  { key: 'hasFacebook', label: 'Do you have a Facebook page?' },
  { key: 'hasInstagram', label: 'Do you have an Instagram account?' },
];

export default function PublicDataFormPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    publicApi.get(`/public/fulfillment/${token}`)
      .then((r) => {
        setForm({ ...r.data.prefill });
        setAlreadyDone(r.data.dataSubmitted);
      })
      .catch((e) => setError(e.response?.data?.error || 'This link is not valid.'))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) set('logoUrl', data.secure_url);
      else alert('Could not upload the logo. Please try again.');
    } catch (_) {
      alert('Could not upload the logo. Please try again.');
    } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.businessName?.trim()) return alert('Please enter your business name.');
    setSubmitting(true);
    try {
      await publicApi.post(`/public/fulfillment/${token}/data`, form);
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Could not submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Shell><p style={s.muted}>Loading…</p></Shell>;
  if (error) return <Shell><p style={s.error}>{error}</p></Shell>;
  if (done) return <Shell><Success title="Thank you! 🎉" text="Your details have been submitted. Our team will start setting up your kit and website." /></Shell>;

  return (
    <Shell>
      <h1 style={s.h1}>Your Business Details</h1>
      <p style={s.sub}>Please confirm or complete the details below so we can build your Tapify kit and website.</p>
      {alreadyDone && (
        <div style={s.notice}>We already received your details — you can update them below if anything changed.</div>
      )}

      {FIELDS.map((f) => (
        <div key={f.key} style={s.field}>
          <label style={s.label}>{f.label}{f.required ? ' *' : ''}</label>
          {f.textarea ? (
            <textarea style={{ ...s.input, height: 72, resize: 'vertical' }} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
          ) : (
            <input style={s.input} type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
          )}
        </div>
      ))}

      <div style={s.field}>
        <label style={s.label}>Business Logo</label>
        {form.logoUrl ? <img src={form.logoUrl} alt="logo" style={s.logo} /> : null}
        <input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} />
        {uploading && <span style={s.muted}> Uploading…</span>}
      </div>

      <div style={s.divider} />
      {SOCIALS.map((soc) => (
        <div key={soc.key} style={s.socialRow}>
          <span style={s.socialLabel}>{soc.label}</span>
          <div style={s.pillRow}>
            {[['Yes', true], ['No', false]].map(([lbl, val]) => {
              const on = form[soc.key] === val;
              return (
                <button key={lbl} type="button" onClick={() => set(soc.key, val)}
                  style={{ ...s.pill, ...(on ? s.pillOn : {}) }}>{lbl}</button>
              );
            })}
          </div>
        </div>
      ))}

      <button style={{ ...s.submit, opacity: submitting ? 0.6 : 1 }} onClick={submit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Details'}
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

function Success({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 0' }}>
      <div style={{ fontSize: 46 }}>✅</div>
      <h2 style={{ color: BRAND, margin: '12px 0 6px' }}>{title}</h2>
      <p style={s.muted}>{text}</p>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#eef1f2', display: 'flex', justifyContent: 'center', padding: '24px 12px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  card: { width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' },
  brandBar: { background: BRAND, color: '#fff', fontWeight: 800, letterSpacing: 2, fontSize: 18, padding: '16px 22px' },
  h1: { color: BRAND, fontSize: 22, margin: '0 0 6px' },
  sub: { color: '#556', fontSize: 14, margin: '0 0 18px', lineHeight: 1.5 },
  notice: { background: '#FEF3C7', color: '#92400E', borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#334', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d5dbe0', borderRadius: 10, padding: '11px 12px', fontSize: 15, color: '#223', outlineColor: BRAND },
  logo: { display: 'block', maxWidth: 120, maxHeight: 80, objectFit: 'contain', marginBottom: 8, border: '1px solid #eee', borderRadius: 8, padding: 4 },
  divider: { height: 1, background: '#eef1f2', margin: '18px 0' },
  socialRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  socialLabel: { fontSize: 14, color: '#334', flex: 1 },
  pillRow: { display: 'flex', gap: 8 },
  pill: { border: '1px solid #d5dbe0', background: '#fff', color: '#334', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  pillOn: { background: BRAND, color: '#fff', borderColor: BRAND },
  submit: { width: '100%', background: BRAND, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 10 },
  muted: { color: '#778', fontSize: 14 },
  error: { color: '#c0392b', fontSize: 15, textAlign: 'center', padding: '20px 0' },
};
