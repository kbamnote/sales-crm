import { useState, useEffect } from 'react';
import { attendanceApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';

// Mirrors the punch-out form in the mobile app; keys match DailyReportSchema.
const FIELD_METRICS = [
  { key: 'freshPresentation', label: 'Fresh Presentation Done' },
  { key: 'followUpVisit', label: 'Follow up Visit' },
  { key: 'appointmentAssigned', label: 'Appointment Assigned' },
  { key: 'appointmentVisit', label: 'Appointment Visit' },
  { key: 'dealClosed', label: 'Deal Closed' },
];
const CALLING_METRICS = [
  { key: 'totalCalls', label: 'Total Dialed Calls' },
  { key: 'callsConnected', label: 'Total Connected Call' },
  { key: 'sameDaySchedule', label: 'Same Day Appointments Fixed' },
  { key: 'nextDaySchedule', label: 'Next Day Appointments Fixed' },
  { key: 'otherDaySchedule', label: 'Other Appointments' },
  { key: 'followUpMeeting', label: 'Follow-Up Meeting' },
  { key: 'meetingDone', label: 'Meeting Done' },
  { key: 'dealDone', label: 'Deals Closed' },
];

const OVERSIGHT_ROLES = ['admin', 'hr'];
const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');

// Base64 -> file download. The API returns the workbook inline rather than a
// URL, so it has to be turned into a Blob on the client.
function downloadBase64Xlsx(base64, filename) {
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buf[i] = bytes.charCodeAt(i);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DailyReportsPage() {
  const { toast } = useApp();
  const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
  const isOversight = OVERSIGHT_ROLES.includes(user?.role);

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Export controls
  const [period, setPeriod] = useState('daily');
  const [exportUserId, setExportUserId] = useState('all');
  const [staff, setStaff] = useState([]);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await attendanceApi.reports(date);
      setReports(r.data || []);
    } catch (e) {
      toast('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  useEffect(() => {
    if (!isOversight) return;
    usersApi.contacts().then((r) => setStaff(r.data || [])).catch(() => {});
  }, [isOversight]);

  const download = async () => {
    setExporting(true);
    try {
      const r = await attendanceApi.exportReport({
        period,
        date,
        // Non-oversight users can only ever export themselves; the server
        // enforces this too.
        userId: isOversight ? exportUserId : undefined,
      });
      downloadBase64Xlsx(r.data.base64, r.data.filename);
      toast('Report downloaded');
    } catch (e) {
      toast(e.response?.data?.error || 'Could not generate the report');
    } finally {
      setExporting(false);
    }
  };

  // Period covered, so it's obvious what the download will contain.
  const periodLabel = () => {
    const d = new Date(`${date}T00:00:00`);
    if (period === 'daily') return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (period === 'weekly') {
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const f = (x) => x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return `${f(mon)} – ${f(sun)}`;
    }
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const calling = reports.filter((r) => r.report?.type === 'calling');
  const field = reports.filter((r) => r.report?.type === 'field');
  const sum = (list, key) => list.reduce((s, r) => s + Number(r.report?.[key] || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {isOversight ? 'Daily Reports' : 'My Daily Reports'}
        </h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="btn btn-sm" />
      </div>

      {/* Export bar */}
      <div className="card" style={{ padding: 14, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 13 }}>Download Excel</strong>

        <select className="btn btn-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        {isOversight && (
          <select className="btn btn-sm" value={exportUserId} onChange={(e) => setExportUserId(e.target.value)}>
            <option value="all">All employees</option>
            {staff.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        )}

        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Covers {periodLabel()}</span>

        <button className="btn btn-primary btn-sm" onClick={download} disabled={exporting} style={{ marginLeft: 'auto' }}>
          {exporting ? 'Preparing…' : '⬇ Download'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mu)' }}>
          No reports for this date.
          {isOversight
            ? ' Reports appear once employees punch out.'
            : ' Your report appears once you punch out for the day.'}
        </div>
      ) : (
        <>
          {calling.length > 0 && (
            <ReportTable
              title={`📞 ${isOversight ? 'Calling Team' : 'My Calling Report'} · ${calling.length} reported`}
              rows={calling}
              metrics={CALLING_METRICS}
              lastCol="Remarks"
              lastKey="remarks"
              sum={sum}
            />
          )}
          {field.length > 0 && (
            <ReportTable
              title={`🧑‍💼 ${isOversight ? 'Sales Team' : 'My Sales Report'} · ${field.length} reported`}
              rows={field}
              metrics={FIELD_METRICS}
              lastCol="Work Category"
              lastKey="workCategory"
              sum={sum}
            />
          )}
        </>
      )}
    </div>
  );
}

function ReportTable({ title, rows, metrics, lastCol, lastKey, sum }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 20, overflowX: 'auto' }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
        <thead>
          <tr style={{ background: 'var(--bg2, #f5f7fa)' }}>
            <Th>Employee</Th>
            <Th>In</Th>
            <Th>Out</Th>
            <Th>Hrs</Th>
            {metrics.map((m) => <Th key={m.key}>{m.label}</Th>)}
            <Th>{lastCol}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rep = r.report || {};
            return (
              <tr key={r._id} style={{ borderTop: '1px solid var(--bd, #e5e7eb)' }}>
                <Td><strong>{r.userId?.name || 'Unknown'}</strong>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{r.userId?.role || ''}</div>
                </Td>
                <Td>{fmtTime(r.punchIn?.time)}</Td>
                <Td>{fmtTime(r.punchOut?.time)}</Td>
                <Td>{r.hoursWorked ? Number(r.hoursWorked).toFixed(1) : '--'}</Td>
                {metrics.map((m) => <Td key={m.key} center>{rep[m.key] ?? 0}</Td>)}
                <Td>{rep[lastKey] || '—'}</Td>
              </tr>
            );
          })}
          <tr style={{ borderTop: '2px solid var(--bd, #e5e7eb)', fontWeight: 700 }}>
            <Td>Total</Td>
            <Td /><Td /><Td />
            {metrics.map((m) => <Td key={m.key} center>{sum(rows, m.key)}</Td>)}
            <Td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }) => (
  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</th>
);
const Td = ({ children, center }) => (
  <td style={{ padding: '8px 10px', textAlign: center ? 'center' : 'left' }}>{children}</td>
);
