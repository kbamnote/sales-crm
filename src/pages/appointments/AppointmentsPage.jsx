import { useState, useEffect } from 'react';
import { appointmentsApi, clientsApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function AppointmentsPage() {
  const { toast, openModal, closeModal } = useApp();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await appointmentsApi.list();
      setAppointments(r.data);
    } catch (e) {
      toast('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    clientsApi.list().then(r => setClients(r.data)).catch(() => {});
    usersApi.list({ role: 'sales' }).then(r => setSalesUsers(r.data)).catch(() => {});
  }, []);

  const handleAutoAssign = async (id) => {
    try {
      await appointmentsApi.autoAssign(id);
      toast('✅ Auto-assigned successfully!');
      load();
    } catch (e) { toast('Auto-assign failed'); }
  };

  const onAdd = () => openModal(
    <AppointmentForm
      clients={clients}
      salesUsers={salesUsers}
      onSave={async (data) => {
        await appointmentsApi.create(data);
        toast('✅ Appointment created!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (apt) => openModal(
    <AppointmentForm
      appointment={apt}
      clients={clients}
      salesUsers={salesUsers}
      onSave={async (data) => {
        await appointmentsApi.update(apt._id, data);
        toast('✅ Updated!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Book Appointment</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Client</th><th>Date & Time</th><th>Assigned To</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : appointments.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No appointments</td></tr>
                : appointments.map(a => (
                  <tr key={a._id}>
                    <td><strong>{a.clientName || 'Client'}</strong></td>
                    <td>{fd(a.date)} {a.time}</td>
                    <td>{a.salesName || '-'}</td>
                    <td>
                      <span className={`badge ${a.status === 'scheduled' ? 'bba' : 'bbl'}`}>
                        {a.status || 'scheduled'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(a)}>Edit</button>
                      {!a.salesId && (
                        <button className="btn btn-xs btn-g" onClick={() => handleAutoAssign(a._id)}>Auto Assign</button>
                      )}
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
function AppointmentForm({ appointment, clients, salesUsers, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: appointment?.clientId?._id || appointment?.clientId || '',
    date: appointment?.date ? new Date(appointment.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    time: appointment?.time || new Date().toTimeString().substring(0, 5),
    salesId: appointment?.salesId?._id || appointment?.salesId || '',
    autoAssign: false
  });
  
  const set = (k, v) => setForm({ ...form, [k]: v });
  
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{appointment ? 'Edit Appointment' : 'Book Appointment'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Select label="Client *" value={form.clientId} onChange={v => set('clientId', v)}
          options={[['', '-- Select Client --'], ...clients.map(c => [c._id, c.name])]} />
        <Input label="Date *" type="date" value={form.date} onChange={v => set('date', v)} required />
        <Input label="Time *" type="time" value={form.time} onChange={v => set('time', v)} required />
        <Select label="Assign Sales Person" value={form.salesId} onChange={v => set('salesId', v)}
          options={[['', '-- Unassigned --'], ...salesUsers.map(u => [u._id, u.name])]} />
      </div>
      
      {!appointment && !form.salesId && (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={form.autoAssign} 
              onChange={e => set('autoAssign', e.target.checked)} 
            />
            Auto-assign to best available sales person
          </label>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm" disabled={!form.clientId}>Save</button>
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
