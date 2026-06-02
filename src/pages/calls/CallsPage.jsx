import { useState, useEffect } from 'react';
import { callsApi, clientsApi, leadsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function CallsPage() {
  const { toast, openModal, closeModal } = useApp();
  const [calls, setCalls] = useState([]);
  const [filter, setFilter] = useState({ outcome: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.outcome) params.outcome = filter.outcome;
      const r = await callsApi.list(params);
      setCalls(r.data);
    } catch (e) {
      toast('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter.outcome]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this call?')) return;
    try {
      await callsApi.delete(id);
      toast('Deleted');
      load();
    } catch (e) { toast('Delete failed'); }
  };

  const onAdd = () => openModal(
    <CallForm
      onSave={async (data) => {
        await callsApi.create(data);
        toast('✅ Call logged!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (call) => openModal(
    <CallForm
      call={call}
      onSave={async (data) => {
        await callsApi.update(call._id, data);
        toast('✅ Updated!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Log Call</button>
        <div style={{ flex: 1 }}></div>
        <select
          className="btn btn-sm"
          value={filter.outcome}
          onChange={e => setFilter({ ...filter, outcome: e.target.value })}
        >
          <option value="">All Outcomes</option>
          <option value="interested">Interested</option>
          <option value="not_interested">Not Interested</option>
          <option value="meeting_fixed">Meeting Fixed</option>
          <option value="callback">Callback</option>
          <option value="no_answer">No Answer</option>
        </select>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Client / Lead</th><th>TMS</th><th>Date & Time</th>
              <th>Duration (min)</th><th>Outcome</th><th>Notes</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : calls.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No calls logged</td></tr>
                : calls.map(c => (
                  <tr key={c._id}>
                    <td><strong>{c.clientName || 'Unknown'}</strong></td>
                    <td>{c.tmsName || '-'}</td>
                    <td>{fd(c.date)} {c.time}</td>
                    <td>{c.duration}</td>
                    <td>
                      <span className={`badge ${
                        c.outcome === 'interested' ? 'bba' :
                        c.outcome === 'meeting_fixed' ? 'bbg' :
                        c.outcome === 'not_interested' ? 'bbr' : 'bbl'
                      }`}>
                        {c.outcome?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.notes}
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(c)}>Edit</button>
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
function CallForm({ call, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientName: call?.clientName || '',
    date: call?.date ? new Date(call.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    time: call?.time || new Date().toTimeString().substring(0, 5),
    duration: call?.duration || '',
    outcome: call?.outcome || 'interested',
    notes: call?.notes || ''
  });
  
  const set = (k, v) => setForm({ ...form, [k]: v });
  
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, duration: Number(form.duration) });
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{call ? 'Edit Call Log' : 'Log Call'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Client/Lead Name" value={form.clientName} onChange={v => set('clientName', v)} required />
        <Input label="Date" type="date" value={form.date} onChange={v => set('date', v)} required />
        <Input label="Time" type="time" value={form.time} onChange={v => set('time', v)} required />
        <Input label="Duration (mins)" type="number" value={form.duration} onChange={v => set('duration', v)} required />
        <Select label="Outcome" value={form.outcome} onChange={v => set('outcome', v)}
          options={[
            ['interested', 'Interested'], ['not_interested', 'Not Interested'], 
            ['meeting_fixed', 'Meeting Fixed'], ['callback', 'Callback'], 
            ['no_answer', 'No Answer']
          ]} />
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
