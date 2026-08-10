import { useState, useEffect } from 'react';
import { leadsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fdt } from '../../utils/helpers';

// Status badge colors (mirrors the app's CampaignLeadsScreen).
const STATUS = {
  new:          { label: 'New',          bg: '#DBEAFE', color: '#1E40AF' },
  contacted:    { label: 'Contacted',    bg: '#FEF3C7', color: '#92400E' },
  qualified:    { label: 'Qualified',    bg: '#E0E7FF', color: '#3730A3' },
  proposal:     { label: 'Proposal',     bg: '#FCE7F3', color: '#9D174D' },
  negotiation:  { label: 'Negotiation',  bg: '#FFE4E6', color: '#9F1239' },
  won:          { label: 'Won',          bg: '#D1FAE5', color: '#065F46' },
  converted:    { label: 'Converted',    bg: '#D1FAE5', color: '#065F46' },
  lost:         { label: 'Lost',         bg: '#F3F4F6', color: '#6B7280' },
  dropped:      { label: 'Dropped',      bg: '#F3F4F6', color: '#6B7280' },
};

export default function CampaignLeadsPage() {
  const { toast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await leadsApi.campaign(statusFilter ? { status: statusFilter } : {});
      setItems(res.data || []);
    } catch {
      toast('Failed to load campaign leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openWhatsApp = (phone) => {
    if (!phone) return;
    window.open(`https://wa.me/${String(phone).replace(/\D/g, '')}`, '_blank');
  };

  // Web equivalent of the app's DocumentPicker → FileSystem.readAsStringAsync:
  // read the picked CSV file as text and feed it straight to the same endpoint.
  const onFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
      doImport(String(reader.result || ''));
    };
    reader.onerror = () => toast('Could not read the CSV file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const doImport = async (text) => {
    if (!text || !text.trim()) return;
    setImporting(true);
    try {
      const r = await leadsApi.importFbCsv(text);
      const { inserted = 0, skipped = 0 } = r.data || {};
      toast(`${inserted} lead${inserted === 1 ? '' : 's'} added${skipped ? `, ${skipped} skipped (duplicates or invalid rows)` : ''}.`);
      setImportOpen(false);
      setCsvText('');
      load();
    } catch (e) {
      toast(e.response?.data?.error || 'Could not import the CSV.');
    } finally {
      setImporting(false);
    }
  };

  const sOf = (item) => STATUS[item.status] || STATUS.new;
  const assigneeOf = (item) => item.assignedTMS?.name || item.assignedSales?.name;

  return (
    <div>
      {/* Header + import */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ margin: 0, flex: 1 }}>Campaign Leads</h3>
        <button className="btn btn-p btn-sm" disabled={importing} onClick={() => setImportOpen(o => !o)}>
          {importing ? 'Importing…' : '📣 Import Facebook Leads (CSV)'}
        </button>
        <select className="btn btn-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {importOpen && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept=".csv,text/csv,text/plain" onChange={onFilePicked} className="btn btn-sm" />
            <span style={{ fontSize: 12, color: 'var(--mu)' }}>
              …or paste the CSV below (Meta Instant Forms export with <strong>id</strong> &amp; <strong>full_name</strong> columns).
            </span>
          </div>
          <textarea
            rows={4}
            placeholder="id,full_name,phone_number,email,city,ad_id,ad_name,form_id,campaign_id"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            style={{ width: '100%', marginTop: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" onClick={() => { setImportOpen(false); setCsvText(''); }}>Cancel</button>
            <button className="btn btn-p btn-sm" disabled={importing || !csvText.trim()} onClick={() => doImport(csvText)}>
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <p className="tw" style={{ textAlign: 'center', padding: 40 }}>Loading...</p> :
        !items.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📣</div>
            <strong style={{ display: 'block', fontSize: 16 }}>No campaign leads yet</strong>
            <p style={{ fontSize: 13, marginTop: 6, maxWidth: 380, margin: '6px auto 0' }}>
              Leads submitted through your Facebook/Instagram Lead Ads will appear here.
            </p>
          </div>
        ) : items.map(item => {
          const s = sOf(item);
          const isOpen = expanded === item._id;
          const assignee = assigneeOf(item);
          return (
            <div key={item._id} className="card" style={{ padding: 14, marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : item._id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  📣
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--mu)' }}>{item.phone}</div>
                  <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 2 }}>{fdt(item.createdAt)}</div>
                </div>
                <span className="badge" style={{ background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
              </div>

              {isOpen && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <Row label="Phone" value={item.phone} link onClick={() => openWhatsApp(item.phone)} />
                  {item.email ? <Row label="Email" value={item.email} /> : null}
                  {item.city ? <Row label="City" value={item.city} /> : null}
                  {item.fbAdName ? <Row label="Ad" value={item.fbAdName} /> : null}
                  {item.fbFormId ? <Row label="Form ID" value={item.fbFormId} /> : null}
                  <Row label="Meta Lead ID" value={item.fbLeadId} />
                  <Row label="Assigned to" value={assignee || 'Unassigned'} />
                  <Row label="Source" value={item.source || 'Facebook Lead Ad'} />
                  {item.notes ? <Row label="Notes" value={item.notes} /> : null}

                  <div style={{ marginTop: 8 }}>
                    {item.fbEventsSent?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.fbEventsSent.map((ev, i) => (
                          <span key={i} className="badge" style={{ background: 'var(--p)', color: '#fff' }}>✓ {ev} reported to Meta</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--mu)', fontStyle: 'italic' }}>No stage updates reported to Meta yet.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function Row({ label, value, link, onClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--mu)', width: 100, flexShrink: 0 }}>{label}</span>
      <button
        onClick={onClick}
        disabled={!onClick}
        style={{
          flex: 1, fontSize: 13, fontWeight: 600, textAlign: 'left',
          border: 'none', background: 'transparent', padding: 0, cursor: onClick ? 'pointer' : 'default',
          color: link ? 'var(--p)' : 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}
      >
        {value}
      </button>
    </div>
  );
}
