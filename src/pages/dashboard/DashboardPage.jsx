/**
 * Dashboard — picks variant based on user role.
 * Each variant component handles its own data fetching.
 *
 * Variants ported from V8.html:
 *   rAdminDash, rManagerDash, rBDODash, rTLDash, rSalesDash,
 *   rTMSDash, rTMEDash, rHRDash
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { reportsApi, meetingsApi, targetsApi, dealsApi, leadsApi, callsApi } from '../../api';
import { fmt, pct, fmtTarget, curMonth } from '../../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'admin':
    case 'manager':
      return <AdminManagerDash />;
    case 'sales':
      return <SalesDash />;
    case 'tms':
    case 'tme':
      return <TMSDash />;
    case 'bdo':
    case 'team_leader':
      return <TeamLeadDash />;
    case 'hr':
      return <HRDash />;
    default:
      return <SimpleDash />;
  }
}

// ───────────────────────────────────────────
function AdminManagerDash() {
  const { brand } = useApp();
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    reportsApi.overview().then(r => setOverview(r.data)).catch(() => {});
    reportsApi.sales().then(r => setSales(r.data)).catch(() => {});
  }, []);

  if (!overview) return <div>Loading...</div>;

  const stats = [
    { label: 'Total Users', value: overview.users, color: 'var(--P)' },
    { label: 'Clients', value: overview.clients, color: 'var(--G)' },
    { label: 'Active Leads', value: overview.leads, color: 'var(--A)' },
    { label: 'Total Calls', value: overview.calls, color: 'var(--C)' },
    { label: 'Meetings', value: overview.meetings, color: 'var(--Pu)' },
    { label: 'Closed Deals', value: overview.deals, color: 'var(--G)' },
    { label: 'Total Revenue', value: fmt(overview.totalRevenue, brand.currency), color: 'var(--G)' },
  ];

  return (
    <div>
      <div className="g4" style={{ marginBottom: 16 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat" style={{ '--cl': s.color }}>
            <div className="sl">{s.label}</div>
            <div className="sv">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Top Sales Performers</h3>
        <div className="tw">
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Meetings</th><th>Deals</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((s, i) => (
                <tr key={s.userId}>
                  <td>{i + 1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.meetings}</td>
                  <td>{s.deals}</td>
                  <td style={{ color: 'var(--G)', fontWeight: 700 }}>{fmt(s.revenue, brand.currency)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function SalesDash() {
  const { user } = useAuth();
  const { brand } = useApp();
  const [target, setTarget] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    targetsApi.list({ userId: user._id, month: curMonth() })
      .then(r => setTarget(r.data[0])).catch(() => {});
    meetingsApi.list({ salesId: user._id })
      .then(r => setMeetings(r.data)).catch(() => {});
    dealsApi.list({ salesId: user._id })
      .then(r => setDeals(r.data)).catch(() => {});
  }, [user._id]);

  const todayMeetings = meetings.filter(m => {
    const d = new Date(m.date).toDateString();
    return d === new Date().toDateString();
  });
  const percentage = target ? pct(target.achieved, target.target) : 0;
  const totalRevenue = deals.reduce((s, d) => s + (d.finalAmount || d.dealValue || 0), 0);

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 6 }}>MY TARGET PROGRESS</div>
        <div style={{ fontSize: 36, fontWeight: 900,
          color: percentage >= 80 ? 'var(--G)' : percentage >= 50 ? 'var(--A)' : 'var(--R)' }}>
          {percentage}%
        </div>
        <div className="prog" style={{ height: 10, marginTop: 8, background: 'var(--bg)', borderRadius: 99 }}>
          <div className="pb" style={{
            width: percentage + '%', height: '100%',
            background: percentage >= 80 ? 'var(--G)' : 'var(--P)', borderRadius: 99
          }} />
        </div>
        <div style={{ fontSize: 12, marginTop: 8 }}>
          {target ? `${fmt(target.achieved, brand.currency)} / ${fmt(target.target, brand.currency)}` : 'No target set'}
        </div>
      </div>

      <div className="g3" style={{ marginBottom: 14 }}>
        <div className="stat"><div className="sl">Today Meetings</div><div className="sv">{todayMeetings.length}</div></div>
        <div className="stat"><div className="sl">My Deals</div><div className="sv">{deals.length}</div></div>
        <div className="stat"><div className="sl">Revenue</div><div className="sv">{fmt(totalRevenue, brand.currency)}</div></div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Today's Meetings</h3>
        {todayMeetings.length === 0
          ? <div style={{ color: 'var(--mu)', padding: 12 }}>No meetings scheduled today</div>
          : todayMeetings.map(m => (
            <div key={m._id} style={{
              padding: 10, marginBottom: 6, background: 'var(--bg)', borderRadius: 8,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.clientName}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>{m.time} • {m.type}</div>
              </div>
              <span className={`badge ${m.status === 'completed' ? 'bbg' : 'bbl'}`}>{m.status}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function TMSDash() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    callsApi.list().then(r => setCalls(r.data)).catch(() => {});
    leadsApi.list().then(r => setLeads(r.data)).catch(() => {});
    targetsApi.list({ userId: user._id, month: curMonth() })
      .then(r => setTarget(r.data[0])).catch(() => {});
  }, [user._id]);

  const today = new Date().toDateString();
  const todayCalls = calls.filter(c => new Date(c.date).toDateString() === today);
  const percentage = target ? pct(target.achieved, target.target) : 0;

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--mu)' }}>CALL TARGET</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: percentage >= 80 ? 'var(--G)' : 'var(--A)' }}>
          {percentage}%
        </div>
        <div style={{ fontSize: 12 }}>{target ? `${target.achieved}/${target.target} calls` : 'No target'}</div>
      </div>
      <div className="g3">
        <div className="stat"><div className="sl">Today's Calls</div><div className="sv">{todayCalls.length}</div></div>
        <div className="stat"><div className="sl">My Leads</div><div className="sv">{leads.length}</div></div>
        <div className="stat"><div className="sl">Total Calls</div><div className="sv">{calls.length}</div></div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function TeamLeadDash() {
  // BDO/TL — sees their team stats
  return <AdminManagerDash />;
}

function HRDash() {
  return <AdminManagerDash />;
}

function SimpleDash() {
  return (
    <div className="card">
      <h3>Welcome</h3>
      <p style={{ color: 'var(--mu)' }}>Your dashboard is being prepared.</p>
    </div>
  );
}
