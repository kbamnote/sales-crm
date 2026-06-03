import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function AttendancePage() {
  const { toast } = useApp();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const r = await attendanceApi.list({ date });
      setAttendance(r.data);
    } catch (e) {
      toast('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Employee Attendance</h2>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="btn btn-sm" 
        />
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>User</th><th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Hours Worked</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : attendance.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No records found for this date</td></tr>
                : attendance.map(a => (
                  <tr key={a._id}>
                    <td><strong>{a.userId?.name || 'Unknown User'}</strong> <br/><span style={{ fontSize: 11, color: 'var(--mu)' }}>{a.userId?.role}</span></td>
                    <td>{fd(a.date)}</td>
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'bbg' : 'bba'}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {a.punchIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {a.punchIn.selfie && (
                            <a href={a.punchIn.selfie} target="_blank" rel="noreferrer" title="View Selfie">
                              <img src={a.punchIn.selfie} alt="Punch In" style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--bo)' }} />
                            </a>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{new Date(a.punchIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <a href={`https://maps.google.com/?q=${a.punchIn.lat},${a.punchIn.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--p)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={a.punchIn.address}>
                              {a.punchIn.address}
                            </a>
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {a.punchOut ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {a.punchOut.selfie && (
                            <a href={a.punchOut.selfie} target="_blank" rel="noreferrer" title="View Selfie">
                              <img src={a.punchOut.selfie} alt="Punch Out" style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--bo)' }} />
                            </a>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{new Date(a.punchOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <a href={`https://maps.google.com/?q=${a.punchOut.lat},${a.punchOut.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--p)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={a.punchOut.address}>
                              {a.punchOut.address}
                            </a>
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
