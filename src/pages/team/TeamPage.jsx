import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd } from '../../utils/helpers';

export default function TeamPage() {
  const { toast, openModal, closeModal } = useApp();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', search: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.role) params.role = filter.role;
      if (filter.search) params.search = filter.search;
      const r = await usersApi.list(params);
      setUsers(r.data);
    } catch (e) {
      toast('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter.role]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await usersApi.delete(id);
      toast('Deleted');
      load();
    } catch (e) { toast('Delete failed'); }
  };

  const onAdd = () => openModal(
    <UserForm
      onSave={async (data) => {
        await usersApi.create(data);
        toast('✅ User created!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (u) => openModal(
    <UserForm
      user={u}
      onSave={async (data) => {
        await usersApi.update(u._id, data);
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
        {['admin', 'manager', 'hr'].includes(currentUser?.role) && (
          <button className="btn btn-p btn-sm" onClick={onAdd}>+ Add Member</button>
        )}
        <input
          className="btn btn-sm"
          style={{ flex: 1, minWidth: 180 }}
          placeholder="Search name/email/phone..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <select
          className="btn btn-sm"
          value={filter.role}
          onChange={e => setFilter({ ...filter, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="sales">Sales</option>
          <option value="tms">TMS</option>
          <option value="hr">HR</option>
        </select>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Phone</th><th>Email</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : users.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No users found</td></tr>
                : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: 10, color: 'var(--mu)' }}>{u.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.role}</td>
                    <td>{u.phone}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.employeeStatus === 'active' || u.active ? 'bbg' : 'bbr'}`}>
                        {u.employeeStatus || (u.active ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(u)}>Edit</button>
                      {currentUser?.role === 'admin' && (
                        <button className="btn btn-xs btn-r" onClick={() => handleDelete(u._id)}>×</button>
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
function UserForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'sales',
    employeeId: user?.employeeId || '',
    password: ''
  });
  
  const set = (k, v) => setForm({ ...form, [k]: v });
  
  const submit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password) delete data.password;
    onSave(data);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{user ? 'Edit Member' : 'Add Member'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Name *" value={form.name} onChange={v => set('name', v)} required />
        <Input label="Email *" type="email" value={form.email} onChange={v => set('email', v)} required />
        <Input label="Phone *" value={form.phone} onChange={v => set('phone', v)} required />
        <Select label="Role" value={form.role} onChange={v => set('role', v)}
          options={[
            ['admin', 'Admin'], ['manager', 'Manager'], ['sales', 'Sales'],
            ['tms', 'TMS'], ['tme', 'TME'], ['hr', 'HR']
          ]} />
        <Input label="Employee ID" value={form.employeeId} onChange={v => set('employeeId', v)} />
        <Input 
          label={user ? "New Password (leave blank to keep)" : "Password *"} 
          type="password" 
          value={form.password} 
          onChange={v => set('password', v)} 
          required={!user} 
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
