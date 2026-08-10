import { useState, useEffect, useMemo } from 'react';
import { attendanceApi, locationsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { today, roleLabel } from '../../utils/helpers';

const STALE_MS = 12 * 60 * 1000;
const todayStr = () => new Date().toISOString().split('T')[0];

const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

const ago = (ms) => {
  if (!ms) return 'no location yet';
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const attChip = (a) => {
  if (a === 'working') return { label: 'Working', bg: '#DBEAFE', fg: '#1E3A8A' };
  if (a === 'done') return { label: 'Checked out', bg: '#D1FAE5', fg: '#065F46' };
  return { label: 'Absent', bg: '#FEE2E2', fg: '#991B1B' };
};

export default function TeamMonitorPage() {
  const { toast } = useApp();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isToday = date === todayStr();
  const dateLabel = () => {
    if (isToday) return 'Today';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (date === y.toISOString().split('T')[0]) return 'Yesterday';
    return new Date(date + 'T00:00:00').toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const load = async () => {
    setLoading(true);
    try {
      const [rosterRes, locRes] = await Promise.all([
        attendanceApi.roster(date).catch(() => ({ data: null })),
        isToday ? locationsApi.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      const roster = rosterRes?.data?.roster || [];
      const locMap = {};
      (locRes.data || []).forEach(l => { locMap[String(l.userId?._id || l.userId)] = l; });

      const merged = roster.map(r => {
        const punchedIn = r.punchIn && !r.punchOut;
        const checkedOut = r.punchIn && r.punchOut;
        const attendance = punchedIn ? 'working' : checkedOut ? 'done' : 'absent';

        let lat, lng, locLabel, online = false;
        if (isToday) {
          const loc = locMap[String(r._id)];
          lat = loc?.lat; lng = loc?.lng;
          const lastSeenMs = loc?.lastSeen ? new Date(loc.lastSeen).getTime() : 0;
          online = !!(lastSeenMs && Date.now() - lastSeenMs < STALE_MS);
          locLabel = loc ? `${loc.area ? loc.area + ' · ' : ''}${ago(lastSeenMs)}` : 'no location yet';
        } else {
          const pin = r.punchIn;
          if (pin?.lat) {
            lat = pin.lat; lng = pin.lng;
            locLabel = `In ${fmtTime(pin.time)}`;
          } else {
            locLabel = 'No punch-in';
          }
        }

        return { user: r, attendance, lat, lng, locLabel, online };
      });

      merged.sort((a, b) => {
        const rank = (x) => (x.attendance === 'working' ? 0 : x.attendance === 'done' ? 1 : 2);
        return rank(a) - rank(b) || (a.user.name || '').localeCompare(b.user.name || '');
      });

      setRows(merged);
    } catch (e) {
      toast('Failed to load team monitor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => { if (isToday) load(); }, 30000);
    return () => clearInterval(t);
  }, [date]);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'working', label: 'Working' },
    { key: 'done', label: 'Checked out' },
    { key: 'absent', label: 'Absent' },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter !== 'all' && r.attendance !== statusFilter) return false;
      if (q && !(r.user.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const openMap = (r) => {
    if (r.lat == null || r.lng == null) return toast(`No location reported for ${r.user.name} yet.`);
    window.open(`https://www.google.com/maps?q=${r.lat},${r.lng}`, '_blank');
  };

  return (
    <div>
      {/* Date + back-to-today */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Monitor Team</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="date" className="btn btn-sm" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} />
          <span style={{ fontSize: 13, color: 'var(--mu)', fontWeight: 600 }}>{dateLabel()}</span>
        </div>
      </div>
      {!isToday && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEF2FF', padding: '8px 14px', borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
          <strong style={{ color: 'var(--p)' }}>Showing: {dateLabel()}</strong>
          <button className="btn btn-sm" style={{ border: 'none', background: 'transparent', color: 'var(--p)', fontWeight: 700 }} onClick={() => setDate(todayStr())}>
            Back to Today ✕
          </button>
        </div>
      )}

      {/* Search */}
      <input
        className="inp"
        placeholder="🔍 Search team member…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 360, marginBottom: 10 }}
      />

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = statusFilter === f.key;
          const count = f.key === 'all' ? rows.length : rows.filter(r => r.attendance === f.key).length;
          return (
            <button key={f.key} className={`btn btn-sm ${active ? 'btn-p' : ''}`} onClick={() => setStatusFilter(f.key)}>
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? <p className="tw" style={{ padding: 40, textAlign: 'center' }}>Loading...</p> :
        !filtered.length ? (
          <p className="tw" style={{ textAlign: 'center', padding: 40 }}>
            {rows.length === 0 ? 'No team members to monitor.' : 'No members match your filter.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {filtered.map(r => {
              const u = r.user;
              const chip = attChip(r.attendance);
              return (
                <div key={u._id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: 'var(--p)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14
                      }}>
                        {(u.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: '50%',
                        border: '2px solid #fff', background: r.online ? '#10B981' : '#9CA3AF'
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</strong>
                        <span className="badge" style={{ background: chip.bg, color: chip.fg, flexShrink: 0 }}>{chip.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'capitalize', marginTop: 1 }}>{roleLabel[u.role] || u.role}</div>
                      <button
                        onClick={() => openMap(r)}
                        style={{
                          fontSize: 12, background: 'transparent', border: 'none', padding: 0, marginTop: 4, cursor: 'pointer',
                          color: r.lat != null ? 'var(--p)' : 'var(--mu)', textAlign: 'left', maxWidth: '100%',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                      >
                        📍 {r.locLabel}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 12, color: 'var(--mu)' }}>
                    <span>In: <strong style={{ color: 'var(--tx)' }}>{fmtTime(u.punchIn?.time)}</strong></span>
                    <span>Out: <strong style={{ color: 'var(--tx)' }}>{fmtTime(u.punchOut?.time)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
