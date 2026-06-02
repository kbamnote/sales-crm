import { useState, useEffect, useRef } from 'react';
import { fieldVisitsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function FieldVisitPage() {
  const { toast, openModal, closeModal } = useApp();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fieldVisitsApi.list();
      setVisits(r.data);
    } catch (e) {
      toast('Failed to load field visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConvertToLead = async (id) => {
    if (!window.confirm('Convert this visit to a lead?')) return;
    try {
      await fieldVisitsApi.convertToLead(id);
      toast('✅ Converted to Lead!');
      load();
    } catch (e) { toast('Conversion failed'); }
  };

  const onAdd = () => openModal(
    <FieldVisitForm
      onSave={async (data) => {
        await fieldVisitsApi.create(data);
        toast('✅ Field visit logged!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Log Field Visit</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Client Name</th><th>Phone</th>
              <th>Interest</th><th>Notes</th><th>Photo</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : visits.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No field visits logged</td></tr>
                : visits.map(v => (
                  <tr key={v._id}>
                    <td>{fd(v.visitDate || v.createdAt)}</td>
                    <td><strong>{v.clientName}</strong></td>
                    <td>{v.phone}</td>
                    <td>
                      <span className={`badge ${
                        v.interest === 'hot' ? 'bbg' :
                        v.interest === 'warm' ? 'bba' :
                        v.interest === 'cold' ? 'bbl' : 'bbr'
                      }`}>{v.interest?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                      {v.notes}
                    </td>
                    <td>
                      {v.photo ? (
                        <img src={v.photo} alt="Visit" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : '-'}
                    </td>
                    <td>
                      {v.convertedToLead ? (
                        <span className="badge" style={{ background: 'var(--bg)', color: 'var(--mu)' }}>Converted</span>
                      ) : (
                        <button className="btn btn-xs btn-p" onClick={() => handleConvertToLead(v._id)}>Convert to Lead</button>
                      )}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function FieldVisitForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    clientName: '',
    phone: '',
    address: '',
    interest: 'warm',
    notes: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loc, setLoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => setError('Camera access denied'));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setError('Location access denied')
      );
    } else {
      setError('Geolocation not supported');
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const retakePhoto = () => {
    setPhoto(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => setError('Camera access denied'));
  };

  const set = (k, v) => setForm({ ...form, [k]: v });
  
  const submit = (e) => {
    e.preventDefault();
    if (!loc) { setError('Location is required'); return; }
    setLoading(true);
    onSave({ ...form, lat: loc.lat, lng: loc.lng, photo });
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>Log Field Visit</h3>
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div className="g2" style={{ gap: 10 }}>
            <Input label="Client/Store Name *" value={form.clientName} onChange={v => set('clientName', v)} required />
            <Input label="Phone" value={form.phone} onChange={v => set('phone', v)} />
            <Input label="Address" value={form.address} onChange={v => set('address', v)} />
            <Select label="Interest Level" value={form.interest} onChange={v => set('interest', v)}
              options={[['hot', 'Hot'], ['warm', 'Warm'], ['cold', 'Cold'], ['not_interested', 'Not Interested']]} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--mu)' }}>Notes</label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 4 }}
            />
          </div>
        </div>

        <div style={{ width: 320 }}>
          <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>Capture Photo</label>
          <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 10, position: 'relative', height: 240 }}>
            {!photo ? (
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={photo} alt="Visit" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {!photo ? (
              <button type="button" className="btn btn-p btn-sm" onClick={capturePhoto}>Take Photo</button>
            ) : (
              <button type="button" className="btn btn-sm" onClick={retakePhoto}>Retake</button>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center' }}>
            {loc ? `📍 ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : '📍 Acquiring location...'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm" disabled={loading || !loc}>
          {loading ? 'Saving...' : 'Save Visit'}
        </button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
