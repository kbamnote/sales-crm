import { useState, useEffect, useRef } from 'react';
import { presentationsApi, salesDecksApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fdt } from '../../utils/helpers';
import { uploadAudio, uploadImage } from '../../utils/upload';

/**
 * Sales Presentation — web port of the app's PresentationFormScreen +
 * PresentationRecordingScreen + presentation history.
 *
 * The three stages of the flow are sub-components:
 *   History   – own past recordings (audio player, selfie, location).
 *   Form      – customer details + browser geolocation + webcam selfie + material.
 *   Recording – deck viewer + MediaRecorder audio (pause/resume) → Cloudinary → POST.
 */
export default function SalesPresentationPage() {
  const [view, setView] = useState('history'); // history | form | recording
  const [pending, setPending] = useState(null); // form data carried into recording

  if (view === 'history') return <HistoryView onNew={() => setView('form')} />;
  if (view === 'form') return <FormView onStart={(data) => { setPending(data); setView('recording'); }} onBack={() => setView('history')} />;
  return <RecordingView data={pending} onDone={() => setView('history')} />;
}

/* ─────────────── HISTORY ─────────────── */

function HistoryView({ onNew }) {
  const { toast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    presentationsApi.getMy()
      .then(r => setItems(r.data || []))
      .catch(() => toast('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>My Presentations</h3>
        <button className="btn btn-p" onClick={onNew}>🎙️ New Presentation</button>
      </div>

      {loading ? <p className="tw">Loading...</p> : !items.length ? (
        <p className="tw">No presentations yet. Start your first one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((p) => {
            const loc = p.location?.latitude && p.location?.longitude
              ? `https://www.google.com/maps?q=${p.location.latitude},${p.location.longitude}`
              : null;
            return (
              <div key={p._id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ fontSize: 15 }}>{p.customerName}</strong>
                    {p.customerCompany && <span style={{ color: 'var(--mu)', fontSize: 13 }}> · {p.customerCompany}</span>}
                    <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
                      {fdt(p.createdAt)} · {fmtDur(p.duration)}
                    </div>
                    {p.customerMobile && <div style={{ fontSize: 12, color: 'var(--mu)' }}>📱 {p.customerMobile}</div>}
                    {p.notes && <div style={{ fontSize: 13, marginTop: 6 }}>{p.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.selfieUrl && (
                      <img src={p.selfieUrl} alt="Selfie" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    {loc && (
                      <a className="btn btn-sm" href={loc} target="_blank" rel="noreferrer">📍</a>
                    )}
                  </div>
                </div>
                {p.audioUrl && (
                  <audio controls preload="none" style={{ width: '100%', marginTop: 10, height: 36 }}>
                    <source src={p.audioUrl} />
                  </audio>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────── FORM ─────────────── */

function FormView({ onStart, onBack }) {
  const { toast } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ customerName: '', customerMobile: '', customerCompany: '', notes: '' });
  const [location, setLocation] = useState(null);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [selfie, setSelfie] = useState(null); // { file, url }
  const [materials, setMaterials] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const selfieInputRef = useRef(null);

  useEffect(() => {
    getLocation();
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    const local = (user?.ppts || []).map((p) => ({ id: 'ppt-' + p._id, title: p.title, url: p.url }));
    let decks = [];
    try {
      const r = await salesDecksApi.list();
      decks = (r.data || []).map((d) => ({ id: 'deck-' + d._id, title: d.title, url: d.fileUrl }));
    } catch (_) { /* assigned decks are optional */ }
    const merged = [...decks, ...local].filter((m) => m.url);
    setMaterials(merged);
    if (merged.length) setSelectedUrl(merged[0].url);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
    setFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setFetchingLoc(false);
      },
      () => { setFetchingLoc(false); toast('Location denied or unavailable — fetch again'); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const onSelfie = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelfie({ file, url: URL.createObjectURL(file) });
  };

  const start = () => {
    if (!form.customerName.trim()) return toast('Customer Name is required');
    if (!location) return toast('Location is required — fetch it again');
    if (!selfie) return toast('Take a selfie before starting');
    onStart({ ...form, location, selfie, pptUrl: selectedUrl });
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <button className="btn btn-sm" onClick={onBack} style={{ marginBottom: 12 }}>← Back to history</button>
      <h3 style={{ margin: '0 0 16px' }}>New Presentation</h3>

      <div className="card" style={{ padding: 18 }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--mu)' }}>Customer Name *</span>
          <input className="inp" style={{ width: '100%', marginTop: 4 }} value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Enter customer name" />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>Mobile (optional)</span>
            <input className="inp" style={{ width: '100%', marginTop: 4 }} value={form.customerMobile}
              onChange={e => setForm({ ...form, customerMobile: e.target.value })} placeholder="Phone" />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>Company (optional)</span>
            <input className="inp" style={{ width: '100%', marginTop: 4 }} value={form.customerCompany}
              onChange={e => setForm({ ...form, customerCompany: e.target.value })} placeholder="Company" />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--mu)' }}>Notes (optional)</span>
          <textarea className="inp" rows={3} style={{ width: '100%', marginTop: 4 }} value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>

      {/* Material picker */}
      {materials.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <h4 style={{ margin: '0 0 10px' }}>Select Material to Present</h4>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {materials.map((m) => {
              const active = selectedUrl === m.url;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedUrl(m.url)}
                  style={{
                    minWidth: 120, padding: 12, borderRadius: 10, border: `2px solid ${active ? 'var(--p)' : 'var(--border)'}`,
                    background: active ? 'var(--p)' : 'var(--bg)', color: active ? '#fff' : 'var(--tx)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 22 }}>📄</span>
                  <span style={{ fontSize: 12, textAlign: 'center', maxWidth: 100 }}>{m.title}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            {selectedUrl
              ? <>Selected: <strong>{materials.find(m => m.url === selectedUrl)?.title}</strong></>
              : <span style={{ color: 'var(--mu)' }}>No material selected (optional)</span>}
          </div>
        </div>
      )}

      {/* Selfie */}
      <div className="card" style={{ padding: 18, marginTop: 12 }}>
        <h4 style={{ margin: '0 0 10px' }}>Selfie Verification *</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {selfie
            ? <img src={selfie.url} alt="Selfie" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🧑</div>}
          <div>
            <input ref={selfieInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={onSelfie} />
            <button className="btn btn-p" onClick={() => selfieInputRef.current?.click()}>
              {selfie ? 'Retake Selfie' : '📷 Take Selfie'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 6 }}>Uses your webcam — allow camera access when prompted.</div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card" style={{ padding: 18, marginTop: 12 }}>
        <h4 style={{ margin: '0 0 10px' }}>Current Location *</h4>
        {fetchingLoc ? (
          <span className="tw">Fetching…</span>
        ) : location ? (
          <span style={{ fontSize: 13 }}>
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}{' '}
            <button className="btn btn-sm" onClick={getLocation} style={{ marginLeft: 8 }}>Refresh</button>
          </span>
        ) : (
          <button className="btn btn-sm" onClick={getLocation}>🔍 Fetch location</button>
        )}
      </div>

      <button className="btn btn-p" onClick={start} style={{ marginTop: 16, width: '100%', padding: 14 }}>
        ▶ Start Presentation
      </button>
    </div>
  );
}

/* ─────────────── RECORDING ─────────────── */

function RecordingView({ data, onDone }) {
  const { toast } = useApp();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const accumulatedRef = useRef(0);   // ms banked from finished segments
  const segmentStartRef = useRef(null); // Date.now() when live segment began
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const durationRef = useRef(0);

  const computeElapsedSec = () => {
    const live = segmentStartRef.current ? Date.now() - segmentStartRef.current : 0;
    return Math.floor((accumulatedRef.current + live) / 1000);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const s = computeElapsedSec();
      durationRef.current = s;
      setDuration(s);
    }, 500);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorderRef.current = mr;
        mr.start();
        setRecording(true);
        setPaused(false);
        accumulatedRef.current = 0;
        segmentStartRef.current = Date.now();
        startTimer();
      } catch (_) {
        setStreamError(true);
      }
    })();
    return () => { cancelled = true; stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const togglePause = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    if (mr.state === 'paused') {
      mr.resume();
      segmentStartRef.current = Date.now();
      startTimer();
      setPaused(false);
    } else {
      mr.pause();
      if (segmentStartRef.current) {
        accumulatedRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setDuration(Math.floor(accumulatedRef.current / 1000));
      setPaused(true);
    }
  };

  const end = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    if (!confirm('End and save this presentation?')) return;

    setProcessing(true);
    const finalDuration = computeElapsedSec() || duration;
    const blobPromise = new Promise((resolve) => {
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' }));
      mr.stop();
    });
    stopStream();
    const audioBlob = await blobPromise;

    try {
      const [audioUrl, selfieUrl] = await Promise.all([
        uploadAudio(audioBlob),
        data.selfie.file ? uploadImage(data.selfie.file) : Promise.resolve(null),
      ]);
      await presentationsApi.create({
        customerName: data.customerName,
        customerMobile: data.customerMobile,
        customerCompany: data.customerCompany,
        notes: data.notes,
        location: data.location,
        duration: finalDuration,
        audioUrl,
        selfieUrl,
      });
      setProcessing(false);
      toast('Presentation recorded and saved ✅');
      onDone();
    } catch (e) {
      setProcessing(false);
      toast('Save failed — recording lost. Try again.');
      console.error(e);
      onDone();
    }
  };

  const viewerSrc = data.pptUrl
    ? (data.pptUrl.toLowerCase().includes('.ppt')
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.pptUrl)}`
        : data.pptUrl)
    : null;

  return (
    <div style={{ height: 'calc(100vh - 160px)', minHeight: 480, display: 'flex', flexDirection: 'column' }}>
      <button className="btn btn-sm" onClick={() => { stopStream(); onDone(); }} style={{ alignSelf: 'flex-start', marginBottom: 8 }} disabled={processing}>
        ← Cancel
      </button>

      {/* Viewer */}
      <div style={{ flex: 1, background: '#525659', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
        {processing ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 10 }}>
            <span style={{ fontSize: 28 }}>⏳</span>
            <span>Uploading recording &amp; selfie…</span>
          </div>
        ) : streamError ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 10 }}>
            <span style={{ fontSize: 40 }}>🎙️</span>
            <span>Microphone unavailable. Allow mic access and try again.</span>
            <button className="btn" onClick={() => { stopStream(); onDone(); }}>Go Back</button>
          </div>
        ) : viewerSrc ? (
          <iframe
            key={viewerSrc}
            src={viewerSrc}
            title="Presentation"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span style={{ fontSize: 56 }}>📄</span>
            <strong style={{ marginTop: 8 }}>{data.customerName}</strong>
            <span style={{ opacity: 0.7, marginTop: 4 }}>No material selected</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 4px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            background: !recording ? '#ccc' : paused ? '#F59E0B' : '#EF4444',
            animation: recording && !paused ? 'pulse 1.2s infinite' : 'none'
          }} />
          <span style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtDur(duration)}</span>
          {paused && <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>Paused</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={togglePause} disabled={!recording || processing}
            style={paused ? { background: '#10B981', color: '#fff' } : undefined}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn" onClick={end} disabled={!recording || processing} style={{ background: '#EF4444', color: '#fff' }}>
            ⏹ End & Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── helpers ─────────────── */

function fmtDur(seconds) {
  const s = Math.floor(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const mm = String(m).padStart(2, '0');
  const sss = String(ss).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}
