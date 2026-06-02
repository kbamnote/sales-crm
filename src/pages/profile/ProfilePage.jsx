import { useState, useEffect } from 'react';
import { profileApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd } from '../../utils/helpers';

export default function ProfilePage() {
  const { toast } = useApp();
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    bankAccountNo: '', bankIfsc: '', bankName: ''
  });

  useEffect(() => {
    profileApi.me().then(r => {
      setProfile(r.data);
      setForm({
        name: r.data.name || '',
        phone: r.data.phone || '',
        address: r.data.address || '',
        emergencyName: r.data.emergency?.name || '',
        emergencyPhone: r.data.emergency?.phone || '',
        emergencyRelation: r.data.emergency?.relation || '',
        bankAccountNo: r.data.bankDetails?.accountNo || '',
        bankIfsc: r.data.bankDetails?.ifsc || '',
        bankName: r.data.bankDetails?.bankName || ''
      });
    }).catch(() => toast('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        emergency: { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation },
        bankDetails: { accountNo: form.bankAccountNo, ifsc: form.bankIfsc, bankName: form.bankName }
      };
      await profileApi.update(dataToSave);
      toast('✅ Profile updated!');
      setAuthUser({ ...authUser, name: form.name, phone: form.phone });
    } catch (err) {
      toast('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await profileApi.uploadPhoto(ev.target.result);
        setProfile({ ...profile, avatar: ev.target.result });
        setAuthUser({ ...authUser, avatar: ev.target.result });
        toast('Photo updated');
      } catch (err) { toast('Photo upload failed'); }
    };
    reader.readAsDataURL(file);
  };

  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await profileApi.uploadDoc(type, ev.target.result);
        setProfile({ ...profile, [type]: ev.target.result });
        toast(`${type.toUpperCase()} uploaded successfully`);
      } catch (err) { toast(`${type} upload failed`); }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>;
  if (!profile) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--mu)' }}>{profile.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--p)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg)' }}>
              ✏️
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
            <div style={{ fontSize: 14, color: 'var(--mu)', marginTop: 4 }}>
              {profile.role.toUpperCase()} • Emp ID: {profile.employeeId || 'N/A'} • Joined: {profile.joinDate ? fd(profile.joinDate) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Personal Details Form */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={handleUpdate}>
            <div className="g2" style={{ gap: 16 }}>
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} required />
              </div>
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Email Address (Read Only)</label>
                <input value={profile.email} disabled style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bgt)' }} />
              </div>
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} required />
              </div>
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Residential Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '10px 0' }}>Emergency Contact</h4>
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Name</label>
                <input name="emergencyName" value={form.emergencyName} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Phone</label>
                <input name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Relation</label>
                <input name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              
              <div className="fg" style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '10px 0' }}>Bank Details</h4>
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Bank Name</label>
                <input name="bankName" value={form.bankName} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Account Number</label>
                <input name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
              <div className="fg">
                <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>IFSC Code</label>
                <input name="bankIfsc" value={form.bankIfsc} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button type="submit" className="btn btn-p" disabled={saving}>{saving ? 'Saving...' : 'Update Profile'}</button>
            </div>
          </form>
        </div>

        {/* Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Documents</h3>
            
            {['aadhar', 'pan', 'resume'].map(docType => (
              <div key={docType} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{docType}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {profile[docType] ? (
                    <a href={profile[docType]} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--p)', textDecoration: 'none' }}>View</a>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--mu)' }}>Not uploaded</span>
                  )}
                  <label className="btn btn-xs">
                    Upload
                    <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={(e) => handleDocUpload(e, docType)} />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Salary Slips</h3>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 16 }}>Select a month to view/download your salary slip.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="month" id="slipMonth" className="btn btn-sm" defaultValue={new Date().toISOString().substring(0, 7)} />
              <button className="btn btn-sm btn-p" onClick={() => {
                const month = document.getElementById('slipMonth').value;
                if (!month) return;
                profileApi.salarySlip(month)
                  .then(r => {
                    if (r.data?.url) window.open(r.data.url, '_blank');
                    else toast('Slip not generated for this month');
                  })
                  .catch(() => toast('Failed to fetch slip'));
              }}>
                Fetch Slip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
