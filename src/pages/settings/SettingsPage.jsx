import { useState, useEffect } from 'react';
import { settingsApi } from '../../api';
import { useApp } from '../../context/AppContext';

export default function SettingsPage() {
  const { toast } = useApp();
  const [settings, setSettings] = useState({
    name: '',
    tagline: '',
    currency: '₹',
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    fontSize: 14,
    address: '',
    phone: '',
    email: '',
    sidebarBg: '#1e1e2d',
    sidebarColor: '#a2a3b7',
    topbarBg: '#ffffff',
    logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.getBrand().then(r => {
      if (r.data) setSettings(r.data);
    }).catch(() => toast('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSettings(prev => ({ ...prev, logo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateBrand(settings);
      toast('✅ Brand settings updated successfully!');
      // Apply theme colors globally if needed
      document.documentElement.style.setProperty('--p', settings.primaryColor);
    } catch (err) {
      toast('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading settings...</div>;

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 350, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
        <h2 style={{ marginBottom: 20 }}>Brand & Company Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="g2" style={{ gap: 16 }}>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Company Name</label>
              <input name="name" value={settings.name} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Tagline</label>
              <input name="tagline" value={settings.tagline} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
            
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Contact Email</label>
              <input name="email" type="email" value={settings.email} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Contact Phone</label>
              <input name="phone" value={settings.phone} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Address</label>
              <textarea name="address" value={settings.address} onChange={handleChange} rows={2} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Currency Symbol</label>
              <input name="currency" value={settings.currency} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Base Font Size (px)</label>
              <input name="fontSize" type="number" value={settings.fontSize} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Primary Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleChange} style={{ width: 40, height: 40, padding: 0, border: 0 }} />
                <input name="primaryColor" value={settings.primaryColor} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Secondary Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} style={{ width: 40, height: 40, padding: 0, border: 0 }} />
                <input name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Sidebar Background</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" name="sidebarBg" value={settings.sidebarBg} onChange={handleChange} style={{ width: 40, height: 40, padding: 0, border: 0 }} />
                <input name="sidebarBg" value={settings.sidebarBg} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>
            <div className="fg">
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Topbar Background</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" name="topbarBg" value={settings.topbarBg} onChange={handleChange} style={{ width: 40, height: 40, padding: 0, border: 0 }} />
                <input name="topbarBg" value={settings.topbarBg} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div className="fg" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 6 }}>Company Logo (Base64)</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 80, height: 80, border: '1px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', overflow: 'hidden' }}>
                  {settings.logo ? <img src={settings.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ fontSize: 10, color: 'var(--mu)' }}>No Logo</span>}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: 12 }} />
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 8 }}>Max size: 1MB. Recommended ratio: 1:1 or 3:1.</div>
                  {settings.logo && <button type="button" onClick={() => setSettings({ ...settings, logo: '' })} className="btn btn-xs btn-r" style={{ marginTop: 8 }}>Remove Logo</button>}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-p" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </form>
      </div>

      {/* Live Preview Pane */}
      <div style={{ width: 350, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--bgt)', fontSize: 12, fontWeight: 'bold' }}>Live Preview</div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ width: 80, background: settings.sidebarBg, color: settings.sidebarColor, padding: 10, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" style={{ width: '100%', background: '#fff', borderRadius: 4, padding: 2 }} />
            ) : (
              <div style={{ fontWeight: 'bold', color: '#fff' }}>{settings.name || 'Logo'}</div>
            )}
            <div style={{ opacity: 0.7 }}>Dashboard</div>
            <div style={{ opacity: 0.7 }}>Leads</div>
            <div style={{ opacity: 0.7 }}>Clients</div>
          </div>
          <div style={{ flex: 1, background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 40, background: settings.topbarBg, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: '#333' }}>
              Topbar
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: settings.fontSize || 14, color: '#333' }}>
                <h3 style={{ color: settings.primaryColor, marginBottom: 8 }}>{settings.name || 'Company Name'}</h3>
                <div style={{ color: 'var(--mu)', fontSize: '0.9em', marginBottom: 12 }}>{settings.tagline || 'Tagline goes here'}</div>
                <button style={{ background: settings.primaryColor, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
                  Primary Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
