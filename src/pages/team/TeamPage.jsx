import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd } from '../../utils/helpers';

export default function TeamPage() {
  const { toast, openModal, closeModal } = useApp();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', search: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.role) params.role = filter.role;
      if (filter.search) params.search = filter.search;
      const [r, all] = await Promise.all([
        usersApi.list(params),
        usersApi.list(),
      ]);
      setUsers(r.data);
      setAllUsers(all.data);
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
      allUsers={allUsers}
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
      allUsers={allUsers}
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
          <option value="bdo">BDO</option>
          <option value="team_leader">Team Leader</option>
          <option value="sales">Sales</option>
          <option value="tms">TMS</option>
          <option value="tme">TME</option>
          <option value="telecaller">Telecaller</option>
          <option value="hr">HR</option>
          <option value="designer">Designer</option>
        </select>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Reports To</th><th>Phone</th><th>Email</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : users.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No users found</td></tr>
                : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                          {u.avatar && /^(https?:|data:image)/.test(u.avatar)
                            ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: 10, color: 'var(--mu)' }}>{u.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.role}</td>
                    <td>
                      {u.managerId ? (
                        <span style={{ fontSize: 13 }}>
                          {typeof u.managerId === 'object' ? u.managerId.name : allUsers.find(x => x._id === u.managerId)?.name || '—'}
                        </span>
                      ) : (
                        <span style={{ color: '#e53e3e', fontSize: 12, fontWeight: 500 }}>⚠ Unassigned</span>
                      )}
                    </td>
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
const CLOUD_NAME = 'dpreeciaf';
const UPLOAD_PRESET = 'salescrm_attendance';

const MANAGER_ROLES = ['admin', 'manager', 'bdo', 'team_leader'];

function UserForm({ user, onSave, onCancel, allUsers = [] }) {
  const managerId = user?.managerId
    ? (typeof user.managerId === 'object' ? user.managerId._id : user.managerId)
    : '';
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'sales',
    employeeId: user?.employeeId || '',
    designation: user?.designation || '',
    department: user?.department || '',
    avatar: user?.avatar || '',
    password: '',
    managerId: managerId || '',
  });
  const [uploading, setUploading] = useState(false);

  const managerOptions = allUsers.filter(u =>
    MANAGER_ROLES.includes(u.role) && u._id !== user?._id
  );

  const set = (k, v) => setForm({ ...form, [k]: v });

  const isPhoto = form.avatar && /^(https?:|data:image)/.test(form.avatar);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: data,
      });
      const result = await res.json();
      if (result.secure_url) set('avatar', result.secure_url);
      else alert(result.error?.message || 'Upload failed');
    } catch (err) {
      alert('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password) delete data.password;
    if (!data.managerId) data.managerId = null;
    onSave(data);
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{user ? 'Edit Member' : 'Add Member'}</h3>

      {/* Profile photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--p)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
          {isPhoto
            ? <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (form.name?.substring(0, 2).toUpperCase() || 'U')}
        </div>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : (isPhoto ? 'Change Photo' : 'Upload Photo')}
          <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
        </label>
        {isPhoto && (
          <button type="button" className="btn btn-xs btn-r" onClick={() => set('avatar', '')}>Remove</button>
        )}
      </div>

      <div className="g2" style={{ gap: 10 }}>
        <Input label="Name *" value={form.name} onChange={v => set('name', v)} required />
        <Input label="Email *" type="email" value={form.email} onChange={v => set('email', v)} required />
        <Input label="Phone *" value={form.phone} onChange={v => set('phone', v)} required />
        <Select label="Role" value={form.role} onChange={v => set('role', v)}
          options={[
            ['admin', 'Admin'], ['manager', 'Manager'], ['bdo', 'BDO'],
            ['team_leader', 'Team Leader'], ['sales', 'Sales'],
            ['tms', 'TMS'], ['tme', 'TME'], ['telecaller', 'Telecaller'],
            ['designer', 'Designer'], ['hr', 'HR']
          ]} />
        <div className="fg">
          <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>
            Reports To {!form.managerId && <span style={{ color: '#e53e3e' }}>*</span>}
          </label>
          <select
            value={form.managerId}
            onChange={e => set('managerId', e.target.value)}
            style={{
              width: '100%', padding: 8,
              border: `1px solid ${!form.managerId ? '#e53e3e' : 'var(--border)'}`,
              borderRadius: 8,
              background: !form.managerId ? '#fff5f5' : undefined,
            }}
          >
            <option value="">— No Manager (Top-level) —</option>
            {managerOptions.map(u => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          {!form.managerId && (
            <div style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>
              Without a manager, this person won't appear in anyone's hierarchy.
            </div>
          )}
        </div>
        <Input label="Designation" value={form.designation} onChange={v => set('designation', v)} />
        <Input label="Department" value={form.department} onChange={v => set('department', v)} />
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
        <button type="submit" className="btn btn-p btn-sm" disabled={uploading}>Save</button>
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
