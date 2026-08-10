import { useState, useEffect } from 'react';
import { newClientsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fdt } from '../../utils/helpers';

const STATUS_META = {
  new: { label: 'New', color: '#EF4444', bg: '#FEE2E2' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  done: { label: 'Done', color: '#10B981', bg: '#D1FAE5' },
};

const waLink = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '#';
};

export default function SupportRequestsPage() {
  const { toast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await newClientsApi.list({ type: 'support' });
      setItems(r.data || []);
    } catch { toast('Failed to load support requests'); }
    finally { setLoading(false); }
  };

  const setStatus = async (id, status) => {
    try {
      await newClientsApi.update(id, { status });
      setItems(items.map(it => it._id === id ? { ...it, status } : it));
      toast('Status updated');
    } catch { toast('Failed to update'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this request?')) return;
    try {
      await newClientsApi.remove(id);
      setItems(items.filter(it => it._id !== id));
      toast('Deleted');
    } catch { toast('Failed to delete'); }
  };

  const counts = {
    new: items.filter(i => i.status === 'new').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    done: items.filter(i => i.status === 'done').length,
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 16px' }}>Support Requests</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Mini label="New" value={counts.new} color="#EF4444" />
        <Mini label="In Progress" value={counts.in_progress} color="#F59E0B" />
        <Mini label="Done" value={counts.done} color="#10B981" />
      </div>

      {loading ? <p className="tw">Loading...</p> : !items.length ? (
        <p className="tw">No support requests yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((it) => {
            const meta = STATUS_META[it.status] || STATUS_META.new;
            const open = expanded === it._id;
            return (
              <div key={it._id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong>{it.name || 'Anonymous'}</strong>
                      <span className="badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                      {it.phone || 'No phone'} · {fdt(it.submittedAt || it.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <a className="btn btn-sm" href={waLink(it.phone)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                    {it.status !== 'in_progress' && <button className="btn btn-sm" onClick={() => setStatus(it._id, 'in_progress')}>Start</button>}
                    {it.status !== 'done' && <button className="btn btn-sm" onClick={() => setStatus(it._id, 'done')}>Done</button>}
                    <button className="btn btn-sm" onClick={() => setExpanded(open ? null : it._id)}>{open ? '▲' : '▼'}</button>
                    <button className="btn btn-sm" onClick={() => remove(it._id)}>🗑️</button>
                  </div>
                </div>

                {open && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    {it.query && <p style={{ margin: '0 0 8px', fontSize: 14 }}>{it.query}</p>}
                    {it.submissionText && (
                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--mu)', whiteSpace: 'pre-wrap' }}>
                        <strong>Full message:</strong>
                        <div>{it.submissionText}</div>
                      </div>
                    )}
                    {it.screenshotUrl && (
                      <img src={it.screenshotUrl} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, marginTop: 10, objectFit: 'contain' }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value ?? 0}</div>
      <div style={{ fontSize: 12, color: 'var(--mu)' }}>{label}</div>
    </div>
  );
}
