/**
 * Leads page — REFERENCE PATTERN for all CRUD pages.
 * Ported from rLeads / openLeadForm / saveLead / convertLead / processBulk in V8.html.
 *
 * Pattern to follow for other entities (clients, calls, deals, etc):
 *  1. useState for list + filters
 *  2. useEffect to load on mount
 *  3. Modal-based form (open/save)
 *  4. Inline actions in table rows
 */
import { useState, useEffect } from 'react';
import { leadsApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import BulkWhatsAppModal from '../../components/BulkWhatsAppModal';
import { fd } from '../../utils/helpers';

export default function LeadsPage() {
  const { toast, openModal, closeModal } = useApp();
  const [leads, setLeads] = useState([]);
  const [tmsUsers, setTmsUsers] = useState([]);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const r = await leadsApi.list(params);
      setLeads(r.data);
    } catch (e) {
      toast('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter.status]);
  useEffect(() => { usersApi.list({ role: 'tms' }).then(r => setTmsUsers(r.data)).catch(() => {}); }, []);

  const handleConvert = async (id) => {
    if (!window.confirm('Convert this lead to client?')) return;
    try {
      await leadsApi.convert(id);
      toast('✅ Converted to Client!');
      load();
    } catch (e) { toast('Conversion failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadsApi.delete(id);
      toast('Deleted');
      load();
    } catch (e) { toast('Delete failed'); }
  };

  const onAdd = () => openModal(
    <LeadForm
      tmsUsers={tmsUsers}
      onSave={async (data) => {
        await leadsApi.create(data);
        toast('✅ Lead added!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (lead) => openModal(
    <LeadForm
      lead={lead}
      tmsUsers={tmsUsers}
      onSave={async (data) => {
        await leadsApi.update(lead._id, data);
        toast('✅ Updated!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onBulkUpload = () => openModal(
    <BulkLeadForm
      tmsUsers={tmsUsers}
      onSave={async (leads, tmsId) => {
        const r = await leadsApi.bulkUpload(leads, tmsId);
        toast(`✅ ${r.data.count} leads imported!`);
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  // Bulk WhatsApp selection helpers.
  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map(l => l._id)));
  };
  const clearSelection = () => { setSelected(new Set()); setBulkOpen(false); };
  const selectedRecipients = leads
    .filter(l => selected.has(l._id) && l.phone)
    .map(l => ({ _id: l._id, name: l.name, phone: l.phone }));

  return (
    <div>
      <BulkWhatsAppModal visible={bulkOpen} onClose={clearSelection} recipients={selectedRecipients} entity="lead" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Add Lead</button>
        <button className="btn btn-sm" onClick={onBulkUpload}>📥 Bulk Upload</button>
        {selected.size > 0 && (
          <button className="btn btn-sm" style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
            onClick={() => setBulkOpen(true)}>
            💬 WhatsApp ({selectedRecipients.length})
          </button>
        )}
        <input
          className="btn btn-sm"
          style={{ flex: 1, minWidth: 180 }}
          placeholder="Search name/phone/company..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <select
          className="btn btn-sm"
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={selected.size > 0 && selected.size === leads.length} onChange={toggleAll} /></th>
              <th>Name</th><th>Phone</th><th>Company</th><th>Source</th>
              <th>Status</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : leads.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No leads</td></tr>
                : leads.map(l => (
                  <tr key={l._id} style={selected.has(l._id) ? { background: '#F0FDF4' } : undefined}>
                    <td><input type="checkbox" checked={selected.has(l._id)} onChange={() => toggle(l._id)} /></td>
                    <td><strong>{l.name}</strong></td>
                    <td>{l.phone}</td>
                    <td>{l.company || '-'}</td>
                    <td>{l.source || '-'}</td>
                    <td><span className={`badge ${
                      l.status === 'converted' ? 'bbg' :
                      l.status === 'qualified' ? 'bba' :
                      l.status === 'dropped' ? 'bbr' : 'bbl'
                    }`}>{l.status}</span></td>
                    <td style={{ fontSize: 11 }}>{fd(l.createdAt)}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(l)}>Edit</button>
                      {l.status !== 'converted' && (
                        <button className="btn btn-xs btn-g" onClick={() => handleConvert(l._id)}>Convert</button>
                      )}
                      <button className="btn btn-xs btn-r" onClick={() => handleDelete(l._id)}>×</button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function LeadForm({ lead, tmsUsers, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    company: lead?.company || '',
    city: lead?.city || '',
    source: lead?.source || '',
    status: lead?.status || 'new',
    assignedTMS: lead?.assignedTMS?._id || lead?.assignedTMS || '',
    notes: lead?.notes || ''
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    onSave(form);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{lead ? 'Edit Lead' : 'Add Lead'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Name *" value={form.name} onChange={v => set('name', v)} required />
        <Input label="Phone *" value={form.phone} onChange={v => set('phone', v)} required />
        <Input label="Email" type="email" value={form.email} onChange={v => set('email', v)} />
        <Input label="Company" value={form.company} onChange={v => set('company', v)} />
        <Input label="City" value={form.city} onChange={v => set('city', v)} />
        <Input label="Source" value={form.source} onChange={v => set('source', v)} placeholder="Cold Call, Referral, etc" />
        <Select label="Status" value={form.status} onChange={v => set('status', v)}
          options={[
            ['new', 'New'], ['contacted', 'Contacted'], ['qualified', 'Qualified'],
            ['converted', 'Converted'], ['dropped', 'Dropped']
          ]} />
        <Select label="Assign TMS" value={form.assignedTMS} onChange={v => set('assignedTMS', v)}
          options={[['', '-- None --'], ...tmsUsers.map(u => [u._id, u.name])]} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 11, color: 'var(--mu)' }}>Notes</label>
        <textarea
          value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
          style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 4 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm">Save</button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────
function BulkLeadForm({ tmsUsers, onSave, onCancel }) {
  const [raw, setRaw] = useState('');
  const [tmsId, setTmsId] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const lines = raw.split('\n').slice(1); // skip header
    const leads = lines.map(line => {
      const p = line.split(',').map(x => x.trim());
      return p[0] && p[2] ? {
        name: p[0], company: p[1] || '', phone: p[2], email: p[3] || '',
        city: p[4] || '', source: p[5] || 'Bulk', status: 'new'
      } : null;
    }).filter(Boolean);
    if (leads.length === 0) return;
    onSave(leads, tmsId);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 10 }}>Bulk Upload Leads (CSV)</h3>
      <p style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 8 }}>
        Format: <code>name, company, phone, email, city, source</code> (first row is header, skipped)
      </p>
      <Select label="Assign all to TMS" value={tmsId} onChange={setTmsId}
        options={[['', '-- None --'], ...tmsUsers.map(u => [u._id, u.name])]} />
      <textarea
        rows={10} value={raw} onChange={e => setRaw(e.target.value)} required
        placeholder="name,company,phone,email,city,source&#10;Ravi Gupta,Gupta Inc,9900001001,ravi@gupta.com,Nagpur,Cold Call"
        style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm">Import</button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
