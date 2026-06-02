import { useState, useEffect, useRef } from 'react';
import { attendanceApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd, fdt } from '../../utils/helpers';

export default function AttendancePage() {
  const { toast, openModal, closeModal } = useApp();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));

  const load = async () => {
    setLoading(true);
    try {
      // If admin/hr, they can see all attendance, but let's stick to 'my' for the standard view
      // Actually we can check role. For simplicity, just load 'my' attendance.
      const r = await attendanceApi.my(month);
      setAttendance(r.data);
    } catch (e) {
      toast('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const handlePunch = (type) => {
    openModal(
      <PunchModal
        type={type}
        onSave={async (data) => {
          try {
            if (type === 'in') await attendanceApi.punchIn(data);
            else await attendanceApi.punchOut(data);
            toast(`✅ Punched ${type.toUpperCase()} successfully!`);
            closeModal();
            load();
          } catch (e) {
            toast('Punch failed');
          }
        }}
        onCancel={closeModal}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-p" onClick={() => handlePunch('in')}>📍 Punch IN</button>
        <button className="btn btn-r" onClick={() => handlePunch('out')}>📍 Punch OUT</button>
        <div style={{ flex: 1 }}></div>
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="btn btn-sm" 
        />
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Hours Worked</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : attendance.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No records found for this month</td></tr>
                : attendance.map(a => (
                  <tr key={a._id}>
                    <td><strong>{fd(a.date)}</strong></td>
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'bbg' : 'bba'}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {a.punchIn ? (
                        <div>
                          <div>{a.punchIn.time}</div>
                          <div style={{ fontSize: 10, color: 'var(--mu)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.punchIn.address}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {a.punchOut ? (
                        <div>
                          <div>{a.punchOut.time}</div>
                          <div style={{ fontSize: 10, color: 'var(--mu)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.punchOut.address}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>{a.hoursWorked ? `${a.hoursWorked.toFixed(1)} hrs` : '-'}</td>
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
function PunchModal({ type, onSave, onCancel }) {
  const [photo, setPhoto] = useState(null);
  const [loc, setLoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => setError('Camera access denied or unavailable'));

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setError('Location access denied')
      );
    } else {
      setError('Geolocation not supported by browser');
    }

    return () => {
      // Cleanup camera
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
    // Stop camera after capture
    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const retakePhoto = () => {
    setPhoto(null);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => setError('Camera access denied'));
  };

  const submit = async () => {
    if (!photo || !loc) {
      setError('Photo and location are required');
      return;
    }
    setLoading(true);
    // In a real app we might reverse-geocode loc.lat/lng to get address
    const address = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`; 
    onSave({
      time: new Date().toTimeString().substring(0, 5),
      lat: loc.lat,
      lng: loc.lng,
      address,
      selfie: photo
    });
  };

  return (
    <div style={{ padding: 20, textAlign: 'center', width: 360 }}>
      <h3 style={{ marginBottom: 16 }}>Punch {type.toUpperCase()}</h3>
      
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 16, position: 'relative', height: 240 }}>
        {!photo ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img src={photo} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
        {!photo ? (
          <button className="btn btn-p" onClick={capturePhoto}>Capture Selfie</button>
        ) : (
          <button className="btn" onClick={retakePhoto}>Retake Photo</button>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20 }}>
        {loc ? `📍 Location acquired: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : '📍 Acquiring location...'}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className={`btn ${type === 'in' ? 'btn-p' : 'btn-r'}`} onClick={submit} disabled={!photo || !loc || loading}>
          {loading ? 'Processing...' : `Confirm Punch ${type.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
