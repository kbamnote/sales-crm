import { useState, useEffect } from 'react';
import { usersApi, permissionsApi } from '../../api';
import { useApp } from '../../context/AppContext';

const PERMISSION_KEYS = [
  'canPrint', 'canDownload', 'canExport', 'canDelete',
  'canCloseDeal', 'canViewSalary', 'canEditOthers', 'canManageCoupons'
];

export default function PermissionsPage() {
  const { toast } = useApp();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.list().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const loadPermissions = async (userId) => {
    setLoading(true);
    try {
      const r = await permissionsApi.get(userId);
      setPermissions(r.data.perms || {});
    } catch (e) {
      toast('Failed to load permissions');
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) loadPermissions(selectedUserId);
    else setPermissions({});
  }, [selectedUserId]);

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await permissionsApi.update(selectedUserId, permissions);
      toast('✅ Permissions saved!');
    } catch (e) {
      toast('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedUserId || !window.confirm('Reset to default role permissions?')) return;
    try {
      await permissionsApi.reset(selectedUserId);
      toast('Permissions reset to default');
      loadPermissions(selectedUserId);
    } catch (e) {
      toast('Reset failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 300 }}>
          <h3 style={{ marginBottom: 10, fontSize: 16 }}>Select User</h3>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, maxHeight: '60vh', overflowY: 'auto' }}>
            {users.map(u => (
              <div 
                key={u._id}
                onClick={() => setSelectedUserId(u._id)}
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  borderRadius: 6,
                  background: selectedUserId === u._id ? 'var(--p)' : 'transparent',
                  color: selectedUserId === u._id ? '#fff' : 'inherit',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 10, fontSize: 16 }}>Permissions Override</h3>
          {!selectedUserId ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--mu)', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 8 }}>
              Select a user to view and override permissions
            </div>
          ) : loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
          ) : (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {PERMISSION_KEYS.map(key => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bgt)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }}>
                    <input 
                      type="checkbox" 
                      checked={!!permissions[key]} 
                      onChange={() => handleToggle(key)} 
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>{key}</span>
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-sm" onClick={handleReset}>Reset to Defaults</button>
                <button className="btn btn-p btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
