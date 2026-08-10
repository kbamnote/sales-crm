import { useState, useEffect } from 'react';
import { clientsApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import BulkWhatsAppModal from '../../components/BulkWhatsAppModal';
import { fd } from '../../utils/helpers';

const TAPIFY_URL = import.meta.env.VITE_TAPIFY_URL || 'https://app.tapify.co.in';

export default function ClientsPage({ myOnly = false }) {
  const { toast, openModal, closeModal } = useApp();
  const [clients, setClients] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
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
      if (myOnly) params.assignedTo = 'me';
      const r = await clientsApi.list(params);
      setClients(r.data);
    } catch {
      toast('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter.status]);
  useEffect(() => {
    usersApi.list({ role: 'sales' }).then(r => setSalesUsers(r.data)).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try {
      await clientsApi.delete(id);
      toast('Deleted');
      load();
    } catch { toast('Delete failed'); }
  };

  const onAdd = () => openModal(
    <ClientForm
      salesUsers={salesUsers}
      onSave={async (data) => {
        try {
          await clientsApi.create(data);
          toast('Client added!');
          closeModal();
          load();
        } catch (e) {
          toast(e.response?.data?.error || 'Failed to add client');
        }
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (client) => openModal(
    <ClientForm
      client={client}
      salesUsers={salesUsers}
      onSave={async (data) => {
        try {
          await clientsApi.update(client._id, data);
          toast('Updated!');
          closeModal();
          load();
        } catch (e) {
          toast(e.response?.data?.error || 'Failed to update client');
        }
      }}
      onCancel={closeModal}
    />
  );

  const onCreateTapify = (client) => openModal(
    <TapifyProfileForm
      client={client}
      onSave={async (data) => {
        try {
          const r = await clientsApi.createTapifyProfile(client._id, data);
          toast('Tapify profile created! ' + r.data.tapify.vcard.preview_url);
          closeModal();
          load();
        } catch (e) {
          toast(e.response?.data?.error || 'Failed to create Tapify profile');
        }
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
    if (selected.size === clients.length) setSelected(new Set());
    else setSelected(new Set(clients.map(c => c._id)));
  };
  const clearSelection = () => { setSelected(new Set()); setBulkOpen(false); };
  const selectedRecipients = clients
    .filter(c => selected.has(c._id) && c.phone)
    .map(c => ({ _id: c._id, name: c.name, phone: c.phone }));

  return (
    <div>
      <BulkWhatsAppModal visible={bulkOpen} onClose={clearSelection} recipients={selectedRecipients} entity="client" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Add Client</button>
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
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={selected.size > 0 && selected.size === clients.length} onChange={toggleAll} /></th>
              <th>Name</th><th>Phone</th><th>Company</th><th>City</th>
              <th>Status</th><th>Tapify</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : clients.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No clients</td></tr>
                : clients.map(c => (
                  <tr key={c._id} style={selected.has(c._id) ? { background: '#F0FDF4' } : undefined}>
                    <td><input type="checkbox" checked={selected.has(c._id)} onChange={() => toggle(c._id)} /></td>
                    <td><strong>{c.name}</strong>{c.email && <div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.email}</div>}</td>
                    <td>{c.phone}</td>
                    <td>{c.company || '-'}</td>
                    <td>{c.city || '-'}</td>
                    <td>
                      <span className={`badge ${
                        c.status === 'active'   ? 'bbg' :
                        c.status === 'closed'   ? 'bbr' :
                        c.status === 'inactive' ? 'bbr' : 'bbl'
                      }`}>{c.status}</span>
                    </td>
                    <td>
                      {c.tapifyProfileCreated
                        ? <a
                            href={`${TAPIFY_URL}/${c.tapifyVcardAlias}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-g"
                          >View Profile</a>
                        : <span style={{ fontSize: 11, color: 'var(--mu)' }}>—</span>
                      }
                    </td>
                    <td style={{ fontSize: 11 }}>{fd(c.createdAt)}</td>
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(c)}>Edit</button>
                      {!c.tapifyProfileCreated && c.email && (
                        <button className="btn btn-xs btn-a" onClick={() => onCreateTapify(c)}>+ Tapify</button>
                      )}
                      <button className="btn btn-xs btn-r" onClick={() => handleDelete(c._id)}>×</button>
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
function ClientForm({ client, salesUsers, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:       client?.name       || '',
    phone:      client?.phone      || '',
    email:      client?.email      || '',
    company:    client?.company    || '',
    city:       client?.city       || '',
    area:       client?.area       || '',
    source:     client?.source     || '',
    status:     client?.status     || 'prospect',
    assignedTo: client?.assignedTo?._id || client?.assignedTo || '',
    notes:      client?.notes      || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const payload = { ...form };
    if (!payload.assignedTo) delete payload.assignedTo;
    onSave(payload);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{client ? 'Edit Client' : 'Add Client'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Name *"  value={form.name}    onChange={v => set('name', v)}  required />
        <Input label="Phone *" value={form.phone}   onChange={v => set('phone', v)} required />
        <Input label="Email"   type="email" value={form.email}   onChange={v => set('email', v)} />
        <Input label="Company" value={form.company} onChange={v => set('company', v)} />
        <Input label="City"    value={form.city}    onChange={v => set('city', v)} />
        <Input label="Area"    value={form.area}    onChange={v => set('area', v)} />
        <Input label="Source"  value={form.source}  onChange={v => set('source', v)} placeholder="Referral, Cold Call…" />
        <Select label="Status" value={form.status}  onChange={v => set('status', v)}
          options={[['prospect','Prospect'],['active','Active'],['inactive','Inactive'],['closed','Closed']]} />
        <Select label="Assigned To" value={form.assignedTo} onChange={v => set('assignedTo', v)}
          options={[['','-- None --'], ...salesUsers.map(u => [u._id, u.name])]} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 11, color: 'var(--mu)' }}>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
          style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm">Save</button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────
function TapifyProfileForm({ client, onSave, onCancel }) {
  const nameParts = client.name.trim().split(' ');
  const [form, setForm] = useState({
    password:    '',
    vcard_name:  client.name,
    occupation:  '',
    first_name:  nameParts[0] || '',
    last_name:   nameParts.slice(1).join(' ') || '',
    description: '',
    template_id: 'vcard1',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18, minWidth: 340 }}>
      <h3 style={{ marginBottom: 6 }}>Create Tapify Profile</h3>
      <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 14 }}>
        This will register <strong>{client.name}</strong> ({client.email}) in Tapify
        and create a digital business card for them.
      </p>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Login Password *" type="password" value={form.password}
          onChange={v => set('password', v)} required placeholder="Min 6 characters" />
        <Input label="vCard Title" value={form.vcard_name}
          onChange={v => set('vcard_name', v)} />
        <Input label="First Name" value={form.first_name}
          onChange={v => set('first_name', v)} />
        <Input label="Last Name"  value={form.last_name}
          onChange={v => set('last_name', v)} />
        <Input label="Occupation / Job Title" value={form.occupation}
          onChange={v => set('occupation', v)} placeholder="e.g. Sales Manager" />
        <Select label="Template" value={form.template_id} onChange={v => set('template_id', v)}
          options={[['vcard1','Default'],['vcard2','Modern'],['vcard3','Minimal']]} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 11, color: 'var(--mu)' }}>Bio / Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
          style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm" disabled={saving}>
          {saving ? 'Creating…' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
