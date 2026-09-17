/**
 * Customer Success admin: Customer Managers and their books of clients, bulk
 * (re)assignment, a scorecard, and the Tapify sync status.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerSuccessApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { HEALTH, ago, errorText } from './shared';

export default function CustomerSuccessAdminPage() {
  const { toast } = useApp();
  const [managers, setManagers] = useState(null);
  const [unassigned, setUnassigned] = useState(null);
  const [score, setScore] = useState(null);
  const [days, setDays] = useState(30);
  const [sync, setSync] = useState(null);

  // bulk assign form
  const [from, setFrom] = useState('unassigned');
  const [health, setHealth] = useState('');
  const [to, setTo] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadManagers = useCallback(async () => {
    try {
      const r = await customerSuccessApi.managers();
      setManagers(r.data.managers || []);
      setUnassigned(r.data.unassigned);
    } catch (e) { toast(errorText(e, 'Could not load managers')); }
  }, [toast]);

  const loadScore = useCallback(async () => {
    try {
      const r = await customerSuccessApi.scorecard(days);
      setScore(r.data.managers || []);
    } catch (e) { toast(errorText(e, 'Could not load scorecard')); }
  }, [days, toast]);

  const loadSync = useCallback(async () => {
    try { setSync((await customerSuccessApi.syncState()).data); } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => { loadManagers(); loadSync(); }, [loadManagers, loadSync]);
  useEffect(() => { loadScore(); }, [loadScore]);

  const assign = async () => {
    if (!to) return toast('Choose who should get them');
    if (to === from) return toast('Pick a different manager to move them to');
    const fromLabel = from === 'unassigned' ? 'unassigned clients' : `${managers.find((m) => m._id === from)?.name}'s clients`;
    const toLabel = to === 'pool' ? 'the unassigned pool' : managers.find((m) => m._id === to)?.name;
    const healthLabel = health ? ` (${HEALTH[health].label} only)` : '';
    if (!window.confirm(`Move all ${fromLabel}${healthLabel} to ${toLabel}?`)) return;
    setAssigning(true);
    try {
      const r = await customerSuccessApi.assign({
        managerId: to === 'pool' ? null : to,
        filter: { fromManagerId: from, ...(health ? { health } : {}) },
      });
      toast(`${r.data.assigned} client${r.data.assigned === 1 ? '' : 's'} moved`);
      loadManagers();
    } catch (e) {
      toast(errorText(e, 'Could not assign'));
    } finally {
      setAssigning(false);
    }
  };

  const syncNow = async () => {
    try {
      await customerSuccessApi.syncNow();
      toast('Sync started — refresh in a minute');
      setTimeout(loadSync, 5000);
    } catch (e) { toast(errorText(e, 'Could not start sync')); }
  };

  const noManagers = managers && managers.length === 0;

  return (
    <div>
      <div className="section-hdr">
        <div>
          <h3>Customer Success</h3>
          <div style={{ fontSize: 11, color: 'var(--mu)' }}>Customer Managers looking after Tapify customers</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-sm" to="/customer-success">Today</Link>
          <Link className="btn btn-sm" to="/customer-success/clients">All clients</Link>
        </div>
      </div>

      {noManagers && (
        <div className="card2" style={{ marginBottom: 12, fontSize: 13 }}>
          No Customer Managers yet. Add a team member with the <b>Customer Manager</b> role in{' '}
          <Link to="/team">Manage Team</Link>. Clients are shared out to them automatically on the next sync.
        </div>
      )}

      {/* ── managers ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-hdr"><h3>Managers</h3></div>
        <div className="tw">
          <table>
            <thead>
              <tr><th>Manager</th><th>Clients</th><th>Active</th><th>Slipping</th><th>Gone quiet</th><th>Never started</th><th>Follow-ups due</th></tr>
            </thead>
            <tbody>
              {!managers ? <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center' }}>Loading…</td></tr> : (
                <>
                  {managers.map((m) => (
                    <tr key={m._id}>
                      <td><b>{m.name}</b><div style={{ fontSize: 11, color: 'var(--mu)' }}>{m.phone || m.email}</div></td>
                      <td>{m.clients.total}</td>
                      <td style={{ color: 'var(--G)' }}>{m.clients.active}</td>
                      <td style={{ color: 'var(--A)' }}>{m.clients.slipping}</td>
                      <td style={{ color: 'var(--R)' }}>{m.clients.quiet}</td>
                      <td>{m.clients.never_started}</td>
                      <td>{m.clients.followUpsDue ? <span className="badge bbr">{m.clients.followUpsDue}</span> : 0}</td>
                    </tr>
                  ))}
                  {unassigned && (
                    <tr style={{ background: 'var(--bg3)' }}>
                      <td><b>Unassigned</b></td>
                      <td>{unassigned.total}</td><td>{unassigned.active}</td><td>{unassigned.slipping}</td>
                      <td>{unassigned.quiet}</td><td>{unassigned.never_started}</td><td>—</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── bulk assign ── */}
      {!noManagers && managers && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-hdr"><h3>Move clients</h3></div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>
            New signups are shared out automatically, least-busy manager first. Use this to rebalance or
            take over someone's book. To move individual clients, open them from the client list.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>Move</span>
            <select className="btn btn-sm" value={health} onChange={(e) => setHealth(e.target.value)}>
              <option value="">all</option>
              {Object.entries(HEALTH).map(([k, h]) => <option key={k} value={k}>{h.label.toLowerCase()}</option>)}
            </select>
            <span style={{ fontSize: 12 }}>clients of</span>
            <select className="btn btn-sm" value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="unassigned">the unassigned pool</option>
              {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <span style={{ fontSize: 12 }}>to</span>
            <select className="btn btn-sm" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">choose…</option>
              {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              {from !== 'unassigned' && <option value="pool">the unassigned pool</option>}
            </select>
            <button className="btn btn-p btn-sm" disabled={assigning} onClick={assign}>{assigning ? 'Moving…' : 'Move'}</button>
          </div>
        </div>
      )}

      {/* ── scorecard ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-hdr">
          <h3>Scorecard</h3>
          <select className="btn btn-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr><th>Manager</th><th>Clients</th><th>% active</th><th>Clients contacted</th><th>Calls</th><th>Nudges sent</th><th>Brought back to active</th></tr>
            </thead>
            <tbody>
              {!score ? <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center' }}>Loading…</td></tr>
                : !score.length ? <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center', color: 'var(--mu)' }}>No Customer Managers yet.</td></tr>
                  : score.map((m) => (
                    <tr key={m._id}>
                      <td><b>{m.name}</b></td>
                      <td>{m.clients}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="prog" style={{ width: 70 }}><div className="pb" style={{ width: `${m.activePercent}%` }} /></div>
                          {m.activePercent}%
                        </div>
                      </td>
                      <td>{m.clientsContacted}</td>
                      <td>{m.calls}</td>
                      <td>{m.nudges}</td>
                      <td><b style={{ color: 'var(--G)' }}>{m.reactivated}</b></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── sync ── */}
      <div className="card2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, gap: 8, flexWrap: 'wrap' }}>
        <div>
          Tapify data synced every 15 minutes.{' '}
          {sync?.lastSuccessAt ? <>Last sync <b>{ago(sync.lastSuccessAt)}</b> · {sync.clients} customers.</> : 'Not synced yet.'}
          {sync?.error && <span style={{ color: 'var(--R)' }}> Last attempt failed: {sync.error}</span>}
          {sync?.running && <b> Syncing now…</b>}
        </div>
        <button className="btn btn-sm" onClick={syncNow}>Sync now</button>
      </div>
    </div>
  );
}
