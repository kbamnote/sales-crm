import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { curMonth, roleLabel } from '../../utils/helpers';

export default function LateStaffPage() {
  const { toast } = useApp();
  const [month, setMonth] = useState(curMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [month]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await attendanceApi.lateStaff(month);
      setData(r.data);
    } catch { toast('Failed to load'); }
    finally { setLoading(false); }
  };

  if (loading && !data) return <p className="tw" style={{ padding: 40, textAlign: 'center' }}>Loading...</p>;

  const shift = data?.shift;
  const sorted = [...(data?.staff || [])].sort((a, b) => (b.lateDays || 0) - (a.lateDays || 0));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Late Staff Report</h3>
        <input type="month" className="btn btn-sm" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Mini label="Total Staff" value={data.totalStaff} />
          <Mini label="Late Incidents" value={data.totalLateDays} />
          <Mini label="Early Leave Incidents" value={data.totalEarlyDays} />
          {shift && <Mini label="Shift Start" value={shift.start} />}
          {shift && <Mini label="Grace" value={`${shift.graceMin} min`} />}
        </div>
      )}

      {!data?.staff?.length ? (
        <p className="tw">No late arrivals recorded for {month}.</p>
      ) : (
        <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
          <table className="tw" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--mu)' }}>
                <th style={{ padding: '6px 8px' }}>Employee</th>
                <th style={{ padding: '6px 8px' }}>Role</th>
                <th style={{ padding: '6px 8px' }}>Late Days</th>
                <th style={{ padding: '6px 8px' }}>Total Late (min)</th>
                <th style={{ padding: '6px 8px' }}>Avg Late (min)</th>
                <th style={{ padding: '6px 8px' }}>Early Days</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s._id} style={{ borderTop: '1px solid var(--border)', fontSize: 13 }}>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.avatar && <img src={s.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />}
                      <strong>{s.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '8px' }}>{roleLabel[s.role] || s.role}</td>
                  <td style={{ padding: '8px' }}>
                    <span className="badge" style={{ background: s.lateDays >= 5 ? '#FEE2E2' : '#FEF3C7', color: s.lateDays >= 5 ? '#EF4444' : '#B45309' }}>
                      {s.lateDays}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>{s.totalLateMinutes ?? 0}</td>
                  <td style={{ padding: '8px' }}>{s.avgLateMinutes ?? 0}</td>
                  <td style={{ padding: '8px' }}>{s.earlyDays ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value ?? '-'}</div>
      <div style={{ fontSize: 12, color: 'var(--mu)' }}>{label}</div>
    </div>
  );
}
