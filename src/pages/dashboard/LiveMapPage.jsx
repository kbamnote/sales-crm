import { useState, useEffect } from 'react';
import { locationsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fdt } from '../../utils/helpers';

// A device reports every 5 min while punched in. If we haven't heard from it in
// more than this window, treat the member as stale/offline regardless of the
// last status they sent (covers killed app, dead GPS, no signal, denied perms).
const STALE_MS = 12 * 60 * 1000;

const effectiveStatus = (loc) => {
  if (!loc?.lastSeen) return 'offline';
  if (Date.now() - new Date(loc.lastSeen).getTime() > STALE_MS) return 'offline';
  return loc.status || 'active';
};

export default function LiveMapPage() {
  const { toast } = useApp();
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await locationsApi.list();
      setLocations(r.data);
      // Keep the selected member in sync with the freshly fetched data so their
      // panel shows the latest coordinates/lastSeen on every poll (and the
      // selection isn't lost on refresh).
      setSelectedLoc((prev) => {
        if (!prev) return r.data.length > 0 ? r.data[0] : null;
        const idOf = (l) => l?.userId?._id || l?.userId;
        return r.data.find((l) => idOf(l) === idOf(prev)) || prev;
      });
    } catch (e) {
      toast('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>
      {/* Left panel - User list */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
          Team Locations
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && locations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>
          ) : locations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu)' }}>No active locations</div>
          ) : (
            locations.map(loc => (
              <div
                key={loc.userId}
                onClick={() => setSelectedLoc(loc)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selectedLoc?.userId === loc.userId ? 'rgba(var(--p-rgb), 0.1)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: effectiveStatus(loc) === 'offline' ? 0.55 : 1
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {loc.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--bg)',
                    background: effectiveStatus(loc) === 'active' ? '#4caf50' :
                                effectiveStatus(loc) === 'meeting' ? '#ff9800' :
                                effectiveStatus(loc) === 'idle' ? '#ffeb3b' : '#9e9e9e'
                  }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{loc.area || 'Unknown Area'}</div>
                  <div style={{ fontSize: 10, color: 'var(--mu)' }}>Last seen: {fdt(loc.lastSeen)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel - Map View */}
      <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedLoc ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 16 }}>{selectedLoc.name}'s Location</strong>
                <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--mu)' }}>
                  {selectedLoc.lat.toFixed(6)}, {selectedLoc.lng.toFixed(6)}
                </span>
              </div>
              <span className={`badge ${
                effectiveStatus(selectedLoc) === 'active' ? 'bbg' :
                effectiveStatus(selectedLoc) === 'meeting' ? 'bba' : 'bbl'
              }`}>
                {effectiveStatus(selectedLoc) === 'offline' && selectedLoc.status !== 'offline'
                  ? 'STALE — NO RECENT UPDATE'
                  : effectiveStatus(selectedLoc).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, width: '100%', position: 'relative' }}>
              <iframe
                title="Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${selectedLoc.lat},${selectedLoc.lng}&z=16&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', color: 'var(--mu)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            Select a team member to view their location
          </div>
        )}
      </div>
    </div>
  );
}
