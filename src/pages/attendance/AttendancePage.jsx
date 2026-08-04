import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function AttendancePage() {
  const { toast } = useApp();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  // Late-staff view (who was late / left early, per month).
  const [lateMonth, setLateMonth] = useState(new Date().toISOString().substring(0, 7));
  const [lateData, setLateData] = useState(null);
  const [lateLoading, setLateLoading] = useState(false);

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

  const loadLate = async () => {
    setLateLoading(true);
    try {
      const r = await attendanceApi.lateStaff(lateMonth);
      setLateData(r.data);
    } catch (e) {
      toast('Failed to load late staff');
    } finally {
      setLateLoading(false);
    }
  };

  useEffect(() => { loadLate(); }, [lateMonth]);

  const lateStaff = lateData?.staff || [];

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

      {/* Late Staff */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 14, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
            ⏰ Late Staff
            {lateData?.shift && (
              <span style={{ fontSize: 11, color: 'var(--mu)', fontWeight: 500, marginLeft: 8 }}>
                Shift {lateData.shift.start} – {lateData.shift.end} · {lateData.shift.graceMin} min grace
              </span>
            )}
          </h3>
          <input
            type="month"
            value={lateMonth}
            onChange={e => setLateMonth(e.target.value)}
            className="btn btn-sm"
          />
        </div>

        {lateData && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="badge bbg">{lateData.totalStaff} staff flagged</span>
            <span className="badge bba">{lateData.totalLateDays} late days</span>
            <span className="badge bbr">{lateData.totalEarlyDays} early leaves</span>
          </div>
        )}

        {lateLoading
          ? <div style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>Loading late staff...</div>
          : lateStaff.length === 0
            ? <div style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No late or early-leaving staff this month 🎉</div>
            : (
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>Role</th><th>Days Late</th><th>Total Min Late</th><th>Avg Late</th><th>Days Left Early</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateStaff.map(s => (
                      <tr key={s._id}>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ textTransform: 'capitalize' }}>{s.role?.replace(/_/g, ' ')}</td>
                        <td><span className={`badge ${s.lateDays > 0 ? 'bbr' : 'bbg'}`}>{s.lateDays}</span></td>
                        <td>{s.totalLateMinutes}</td>
                        <td>{s.avgLateMinutes}</td>
                        <td><span className={`badge ${s.earlyDays > 0 ? 'bba' : 'bbg'}`}>{s.earlyDays}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* Daily attendance */}
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
