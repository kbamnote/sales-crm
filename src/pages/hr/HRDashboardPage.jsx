import { useState, useEffect } from 'react';
import { hrDashboardApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { curMonth, fd, fdt, fmt, roleColor, roleLabel } from '../../utils/helpers';

export default function HRDashboardPage() {
  const { toast } = useApp();
  const [month, setMonth] = useState(curMonth());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(month); }, [month]);

  const load = async (m) => {
    setLoading(true);
    try {
      const r = await hrDashboardApi.stats(m);
      setStats(r.data);
    } catch (e) {
      toast('Failed to load HR dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  const t = stats?.todaySummary || {};
  const trend = Array.isArray(stats?.trend) ? stats.trend : [];
  const roleCounts = Object.entries(stats?.roleCounts || {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>HR Dashboard</h3>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="btn btn-sm" />
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Stat label="Total Employees" value={stats?.totalEmployees ?? '-'} icon="👥" />
        <Stat label="Today Present" value={t.present ?? '-'} icon="✅" />
        <Stat label="Today Working" value={t.working ?? '-'} icon="🏃" />
        <Stat label="Checked Out" value={t.checkedOut ?? '-'} icon="🏁" />
        <Stat label="Today Absent" value={t.absent ?? '-'} icon="❌" />
        <Stat label="Working Days" value={stats?.workingDays ?? '-'} icon="🗓️" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Role distribution */}
        <div className="card" style={{ padding: 18 }}>
          <h4 style={{ marginBottom: 12 }}>Team by Role</h4>
          {roleCounts.length === 0 ? <p style={{ color: 'var(--mu)', fontSize: 13 }}>No data</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roleCounts.map(([role, count]) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: roleColor[role] || '#999' }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{roleLabel[role] || role}</span>
                  <strong style={{ fontSize: 13 }}>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent joinings */}
        <div className="card" style={{ padding: 18 }}>
          <h4 style={{ marginBottom: 12 }}>Recent Joinings</h4>
          {!stats?.recentJoinings?.length ? <p style={{ color: 'var(--mu)', fontSize: 13 }}>No recent joinings</p> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.recentJoinings.map((u, i) => (
                <li key={u._id || i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <strong>{u.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{roleLabel[u.role] || u.role} · {fd(u.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Attendance extremes */}
        <div className="card" style={{ padding: 18 }}>
          <h4 style={{ marginBottom: 12 }}>Attendance Leaders</h4>
          <div style={{ fontSize: 13, marginBottom: 6 }}>💪 Most Present</div>
          {stats?.mostPresent?.length ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
              {stats.mostPresent.map((u, i) => (
                <li key={i} style={{ padding: '4px 0', fontSize: 13 }}>
                  <strong>{u.name}</strong> <span style={{ color: 'var(--mu)' }}>— {u.presentDays} days</span>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--mu)', fontSize: 13 }}>No data</p>}
          <div style={{ fontSize: 13, marginBottom: 6 }}>😴 Most Absent</div>
          {stats?.mostAbsent?.length ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.mostAbsent.map((u, i) => (
                <li key={i} style={{ padding: '4px 0', fontSize: 13 }}>
                  <strong>{u.name}</strong> <span style={{ color: 'var(--mu)' }}>— {u.absentDays} days</span>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--mu)', fontSize: 13 }}>No data</p>}
        </div>
      </div>

      {/* Monthly trend */}
      {trend.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>Daily Presence Trend — {month}</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, overflowX: 'auto' }}>
            {trend.map((d, i) => (
              <div key={i} style={{ flex: '1 0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%', background: 'var(--p)', borderRadius: '3px 3px 0 0',
                    height: Math.max(4, (d.present / (stats?.totalEmployees || 1)) * 100), opacity: 0.85
                  }}
                  title={`${d.date}: ${d.present} present`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--mu)' }}>{label}</div>
    </div>
  );
}
