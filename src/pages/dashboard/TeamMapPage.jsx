import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationsApi, attendanceApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { today, fdt, roleLabel } from '../../utils/helpers';

// Same staleness window as LiveMapPage — a device reports every ~5 min while
// punched in; if we haven't heard from it in 12 min treat it as offline.
const STALE_MS = 12 * 60 * 1000;

const INDIA = [20.5937, 78.9629];

// Marker color by effective status: working (present, not punched out),
// done (punched out), offline/stale, absent (no live location).
const colorFor = (mem) => {
  if (mem.effective === 'offline') return '#9E9E9E';
  if (mem.effective === 'done') return '#3B82F6';
  if (mem.effective === 'absent') return '#EF4444';
  return '#10B981'; // working
};

const labelFor = (mem) => {
  if (mem.effective === 'offline') return 'Offline';
  if (mem.effective === 'done') return 'Punched out';
  if (mem.effective === 'absent') return 'Absent';
  return 'Working';
};

export default function TeamMapPage() {
  const { toast } = useApp();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: true }).setView(INDIA, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const [locRes, rosterRes] = await Promise.all([
        locationsApi.list(),
        attendanceApi.roster(today()).catch(() => ({ data: null })),
      ]);
      const locs = locRes.data || [];
      const roster = rosterRes?.data?.roster || [];
      const statusByUser = {};
      roster.forEach(r => { statusByUser[String(r._id)] = r; });

      const membersList = locs
        .filter(l => l.lat != null && l.lng != null && l.userId)
        .map(l => {
          const uid = l.userId?._id || l.userId;
          const rec = statusByUser[String(uid)];
          const stale = !l.lastSeen || Date.now() - new Date(l.lastSeen).getTime() > STALE_MS;
          const punchedOut = !!rec?.punchOut;
          const effective = stale ? 'offline' : punchedOut ? 'done' : 'working';
          return {
            key: String(uid),
            userId: uid,
            name: l.name || l.userId?.name || 'Unknown',
            role: l.userId?.role || '',
            avatar: l.userId?.avatar,
            lat: l.lat, lng: l.lng,
            area: l.area || '',
            lastSeen: l.lastSeen,
            effective,
            status: l.status,
          };
        });

      // Absentees (in roster, no live location today) get listed but no marker.
      const withLoc = new Set(membersList.map(m => m.userId));
      const absentees = roster
        .filter(r => !withLoc.has(String(r._id)))
        .map(r => ({
          key: 'abs-' + r._id, userId: r._id, name: r.name, role: r.role,
          avatar: null, lat: null, lng: null, area: '', lastSeen: null,
          effective: 'absent', status: 'absent',
        }));

      setMembers([...membersList, ...absentees]);
      draw(membersList);
    } catch (e) {
      toast('Failed to load team map');
    } finally {
      setLoading(false);
    }
  };

  const draw = (mems) => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    if (!mems.length) return;

    const layer = L.layerGroup();
    mems.forEach(m => {
      L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:${colorFor(m)};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:800">${(m.name||'?').substring(0,1).toUpperCase()}</div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        }),
      })
        .bindPopup(`<strong>${m.name}</strong><br>${labelFor(m)}<br>${fdt(m.lastSeen)}`)
        .addTo(layer);
    });

    layerRef.current = layer;
    layer.addTo(map);

    if (mems.length === 1) {
      map.setView([mems[0].lat, mems[0].lng], 15);
    } else if (mems.length > 1) {
      map.fitBounds(L.latLngBounds(mems.map(m => [m.lat, m.lng])).pad(0.2));
    }
  };

  const flyTo = (m) => {
    setSelected(m);
    if (m.lat != null && mapRef.current) {
      mapRef.current.setView([m.lat, m.lng], 15);
    }
  };

  const counts = {
    working: members.filter(m => m.effective === 'working').length,
    done: members.filter(m => m.effective === 'done').length,
    offline: members.filter(m => m.effective === 'offline').length,
    absent: members.filter(m => m.effective === 'absent').length,
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 100px)', flexWrap: 'wrap' }}>
      {/* Left roster */}
      <div style={{ width: 300, flex: '1 1 280px', display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', fontWeight: 'bold', fontSize: 14 }}>
          Team Map
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, flexWrap: 'wrap' }}>
          <span><span style={{ color: '#10B981' }}>●</span> Working {counts.working}</span>
          <span><span style={{ color: '#3B82F6' }}>●</span> Done {counts.done}</span>
          <span><span style={{ color: '#9E9E9E' }}>●</span> Offline {counts.offline}</span>
          <span><span style={{ color: '#EF4444' }}>●</span> Absent {counts.absent}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <p className="tw" style={{ padding: 20, textAlign: 'center' }}>Loading...</p> :
            !members.length ? <p className="tw" style={{ padding: 20, textAlign: 'center' }}>No team locations</p> :
            members.map(m => (
              <button
                key={m.key}
                onClick={() => flyTo(m)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                  borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer',
                  opacity: m.effective === 'offline' ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, overflow: 'hidden' }}>
                    {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--bg)', background: colorFor(m) }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{m.effective === 'absent' ? 'No location today' : (m.area || 'Unknown area')}</div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: '2 1 400px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {selected && selected.lat != null && (
          <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,.15)', zIndex: 500 }}>
            <strong style={{ fontSize: 13 }}>{selected.name}</strong>
            <div style={{ fontSize: 11, color: 'var(--mu)' }}>{labelFor(selected)} · {fdt(selected.lastSeen)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
