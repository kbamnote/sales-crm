/**
 * Tapify Clients — every customer in the requester's care (admin: everyone),
 * with health tabs, search, "never used <feature>" and app filters.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerSuccessApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { HEALTH, HealthBadge, ago, dateOnly, errorText } from './shared';

const TABS = [['', 'All'], ['active', HEALTH.active.label], ['slipping', HEALTH.slipping.label], ['quiet', HEALTH.quiet.label], ['never_started', HEALTH.never_started.label]];

export default function TapifyClientsPage() {
  const { toast } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [health, setHealth] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState(''); // debounced q
  const [unused, setUnused] = useState('');
  const [app, setApp] = useState('');
  const [followUps, setFollowUps] = useState(false);
  const [sort, setSort] = useState('recent');
  const [managerId, setManagerId] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    customerSuccessApi.catalog().then((r) => setCatalog(r.data.features || [])).catch(() => {});
    if (isAdmin) customerSuccessApi.managers().then((r) => setManagers(r.data.managers || [])).catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25, sort };
      if (health) params.health = health;
      if (query) params.q = query;
      if (unused) params.unused = unused;
      if (app) params.app = app;
      if (followUps) params.followUps = 'due';
      if (managerId) params.managerId = managerId;
      const r = await customerSuccessApi.clients(params);
      setData(r.data);
    } catch (e) {
      toast(errorText(e, 'Could not load clients'));
    } finally {
      setLoading(false);
    }
  }, [page, sort, health, query, unused, app, followUps, managerId, toast]);

  useEffect(() => { load(); }, [load]);

  const reset = (setter) => (v) => { setter(v); setPage(1); };
  const counts = data?.counts || {};
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <div className="section-hdr">
        <div>
          <h3>Tapify clients</h3>
          <div style={{ fontSize: 11, color: 'var(--mu)' }}>
            {isAdmin ? 'Every Tapify customer, however they signed up' : 'Customers assigned to you'}
          </div>
        </div>
        <Link className="btn btn-sm" to="/customer-success">← Today</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {TABS.map(([key, label]) => (
          <button key={key || 'all'} className={`btn btn-sm ${health === key ? 'btn-p' : ''}`} onClick={() => reset(setHealth)(key)}>
            {label} <span style={{ opacity: 0.7 }}>({(key ? counts[key] : counts.all) ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="btn btn-sm" style={{ minWidth: 220, cursor: 'text' }}
            placeholder="Search name, phone, email or Tapify ID"
            value={q} onChange={(e) => setQ(e.target.value)}
          />
          <select className="btn btn-sm" value={unused} onChange={(e) => reset(setUnused)(e.target.value)}>
            <option value="">Any feature usage</option>
            {catalog.filter((f) => !['app', 'dashboard'].includes(f.key)).map((f) => (
              <option key={f.key} value={f.key}>Never used {f.label}</option>
            ))}
          </select>
          <select className="btn btn-sm" value={app} onChange={(e) => reset(setApp)(e.target.value)}>
            <option value="">App: any</option>
            <option value="installed">App installed</option>
            <option value="missing">App not installed</option>
          </select>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={followUps} onChange={(e) => reset(setFollowUps)(e.target.checked)} style={{ marginRight: 4 }} />
            Follow-up due
          </label>
          {isAdmin && (
            <select className="btn btn-sm" value={managerId} onChange={(e) => reset(setManagerId)(e.target.value)}>
              <option value="">All managers</option>
              <option value="unassigned">Unassigned</option>
              {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          )}
          <div style={{ flex: 1 }} />
          <select className="btn btn-sm" value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
            <option value="recent">Recently active</option>
            <option value="inactive">Least active</option>
            <option value="signup">Newest signups</option>
            <option value="inquiries">Most unread inquiries</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Status</th><th>Last seen</th><th>App</th>
              <th>Features used</th><th>Inquiries</th><th>Signed up</th>
              {isAdmin && <th>Manager</th>}
              <th>Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>
            ) : !data?.clients?.length ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'var(--mu)' }}>No clients match.</td></tr>
            ) : data.clients.map((c) => (
              <tr key={c.tapifyUserId}>
                <td>
                  <Link to={`/customer-success/clients/${c.tapifyUserId}`} style={{ fontWeight: 700, color: 'var(--tx)' }}>
                    {c.name || `Customer #${c.tapifyUserId}`}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.phone || c.email}</div>
                </td>
                <td><HealthBadge health={c.health} /></td>
                <td style={{ fontSize: 12 }}>{ago(c.lastSeenAt)}</td>
                <td>
                  {c.app.installed
                    ? <span className="badge bbg">{c.app.platform === 'ios' ? 'iPhone' : c.app.platform === 'android' ? 'Android' : 'Installed'}</span>
                    : <span className="badge bbgr">No</span>}
                </td>
                <td style={{ fontSize: 12 }}>{c.featuresUsed}</td>
                <td style={{ fontSize: 12 }}>
                  {c.inquiries?.total || 0}
                  {c.inquiries?.unread > 0 && <span className="badge bba" style={{ marginLeft: 4 }}>{c.inquiries.unread} unread</span>}
                </td>
                <td style={{ fontSize: 12 }}>{dateOnly(c.signedUpAt)}</td>
                {isAdmin && <td style={{ fontSize: 12 }}>{c.assignedTo?.name || <span style={{ color: 'var(--mu)' }}>Unassigned</span>}</td>}
                <td style={{ fontSize: 11, color: 'var(--mu)', maxWidth: 220 }}>{c.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > data.limit && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12, color: 'var(--mu)' }}>Page {page} of {pages} · {data.total} clients</span>
          <button className="btn btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
