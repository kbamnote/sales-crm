import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usersApi, locationsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { today, roleLabel } from '../../utils/helpers';

const INDIA = [20.5937, 78.9629];

const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Total path distance in km (haversine over the points).
function routeKm(pts) {
  let m = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const R = 6371000;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
    const la1 = (a.latitude * Math.PI) / 180, la2 = (b.latitude * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    m += 2 * R * Math.asin(Math.sqrt(h));
  }
  return (m / 1000).toFixed(1);
}

export default function RouteHistoryPage() {
  const { toast } = useApp();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(today());
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const mapRef = useRef(null);
  const layerRef = useRef(null); // polyline + markers layer

  useEffect(() => {
    usersApi.contacts().then(r => setUsers(r.data || [])).catch(() => {});
  }, []);

  // Init the Leaflet map once.
  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: true }).setView(INDIA, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    return () => { map.remove(); };
  }, []);

  const draw = (pts) => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    if (!pts.length) return;

    const layer = L.layerGroup();
    const coords = pts.map(p => [p.latitude, p.longitude]);

    if (pts.length > 1) {
      L.polyline(coords, { color: '#3B82F6', weight: 4, opacity: 0.9 }).addTo(layer);
    }

    const makeMarker = (pt, color, label) => {
      L.marker([pt.latitude, pt.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        }),
      }).bindPopup(`<strong>${label}</strong><br>${fmtTime(pt.ts)}`).addTo(layer);
    };

    makeMarker(pts[0], '#10B981', 'Start');
    if (pts.length > 1) makeMarker(pts[pts.length - 1], '#EF4444', 'End');

    layerRef.current = layer;
    layer.addTo(map);

    if (pts.length === 1) {
      map.setView(coords[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(coords).pad(0.15));
    }
  };

  const loadRoute = async (user, day) => {
    if (!user) return;
    setLoading(true);
    setPoints([]);
    try {
      const from = new Date(day + 'T00:00:00');
      const to = new Date(day + 'T23:59:59.999');
      const r = await locationsApi.history(user._id, { from: from.toISOString(), to: to.toISOString() });
      const pts = (r.data || [])
        .filter(p => p.lat != null && p.lng != null)
        .map(p => ({ latitude: p.lat, longitude: p.lng, ts: p.ts }));
      setPoints(pts);
      setTimeout(() => draw(pts), 50);
    } catch (e) {
      toast('Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  const pickUser = (u) => { setSelected(u); setPickerOpen(false); loadRoute(u, date); };
  const onDate = (d) => { setDate(d); if (selected) loadRoute(selected, d); };

  const startPt = points[0];
  const endPt = points[points.length - 1];

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => setPickerOpen(true)} style={{ minWidth: 200, justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
          <span>{selected ? selected.name : 'Select member'}</span> <span style={{ color: 'var(--mu)' }}>▾</span>
        </button>
        <input type="date" className="btn btn-sm" value={date} max={today()} onChange={e => onDate(e.target.value)} />
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: 'calc(100vh - 320px)', minHeight: 420, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.5)', zIndex: 500 }}>
            <span className="btn btn-sm">Loading route…</span>
          </div>
        )}
        {!loading && !selected && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 500 }}>
            <p style={{ color: 'var(--mu)', textAlign: 'center', padding: 20 }}>Select a team member and date to view their route.</p>
          </div>
        )}
        {!loading && selected && points.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 500 }}>
            <p style={{ color: 'var(--mu)', textAlign: 'center', padding: 20 }}>
              No route recorded for {selected.name} on {fmtDate(new Date(date + 'T00:00:00'))}.
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {points.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 12, padding: '12px 0' }}>
          <Sum value={`${routeKm(points)} km`} label="Distance" />
          <Divider />
          <Sum value={fmtTime(startPt.ts)} label="Start" />
          <Divider />
          <Sum value={fmtTime(endPt.ts)} label="Last seen" />
        </div>
      )}

      {/* Member picker sheet */}
      {pickerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setPickerOpen(false)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 480, maxHeight: '70vh', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <strong>Select Member</strong>
              <button className="btn btn-sm" style={{ border: 'none', background: 'transparent' }} onClick={() => setPickerOpen(false)}>✕</button>
            </div>
            <div style={{ maxHeight: 'calc(70vh - 52px)', overflowY: 'auto' }}>
              {!users.length && <p className="tw" style={{ padding: 20 }}>No members found.</p>}
              {users.map(u => (
                <button
                  key={u._id}
                  onClick={() => pickUser(u)}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px', border: 'none', background: 'transparent', borderBottom: '1px solid var(--border)', cursor: 'pointer'
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(u.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'capitalize' }}>{roleLabel[u.role] || u.role}</div>
                  </div>
                  {selected?._id === u._id && <span style={{ color: 'var(--p)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sum({ value, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: 'var(--border)' }} />;
}
