import { useState, useEffect } from 'react';
import { targetsApi, usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { getTargetMeta } from '../../utils/helpers';

export default function TargetsPage() {
  const { toast, openModal, closeModal } = useApp();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));

  const load = async () => {
    setLoading(true);
    try {
      const r = await targetsApi.list({ month });
      setTargets(r.data);
    } catch (e) {
      toast('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const onAdd = () => openModal(
    <TargetForm
      month={month}
      onSave={async (data) => {
        await targetsApi.set(data);
        toast('✅ Target set!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Set Target</button>
        <div style={{ flex: 1 }}></div>
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="btn btn-sm" 
        />
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>User</th><th>Month</th><th>Target</th>
              <th>Achieved</th><th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : targets.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No targets for this month</td></tr>
                : targets.map(t => {
                  const pct = t.target > 0 ? Math.min(100, Math.round((t.achieved / t.target) * 100)) : 0;
                  return (
                    <tr key={t._id}>
                      <td>
                        <strong>{t.userId?.name || 'Unknown User'}</strong>
                        {t.userId?.role ? <div style={{ fontSize: 10, color: 'var(--mu)' }}>{t.userId.role}</div> : null}
                      </td>
                      <td>{t.month}</td>
                      <td>{t.target?.toLocaleString()} <span style={{ fontSize: 11, color: 'var(--mu)' }}>{getTargetMeta(t.userId?.role).unit}</span></td>
                      <td>{t.achieved?.toLocaleString() || 0}</td>
                      <td style={{ width: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--border)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, background: 'var(--p)', height: '100%' }}></div>
                          </div>
                          <span style={{ fontSize: 11 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
function TargetForm({ month, onSave, onCancel }) {
  const [form, setForm] = useState({
    userId: '',
    month: month,
    target: ''
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    usersApi.list().then(r => setUsers(r.data)).catch(() => {});
  }, []);
  
  const set = (k, v) => setForm({ ...form, [k]: v });

  const selectedUser = users.find(u => u._id === form.userId);
  const meta = getTargetMeta(selectedUser?.role);

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, target: Number(form.target) });
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>Set Target</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Select label="User *" value={form.userId} onChange={v => set('userId', v)}
          options={[['', '-- Select User --'], ...users.map(u => [u._id, `${u.name}${u.role ? ' — ' + u.role : ''}`])]} />
        <Input label="Month *" type="month" value={form.month} onChange={v => set('month', v)} required />
        <Input
          label={`${meta.icon} ${meta.label} *`}
          type="number"
          value={form.target}
          onChange={v => set('target', v)}
          required
          placeholder={`Number of ${meta.unit} for the month`}
        />
      </div>
      {form.userId && (
        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 8 }}>
          Setting <strong>{meta.unit}</strong> target for {selectedUser?.name}.
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm" disabled={!form.userId}>Save</button>
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
