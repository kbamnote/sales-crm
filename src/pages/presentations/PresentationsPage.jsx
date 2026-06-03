import { useState, useEffect, useRef } from 'react';
import { usersApi, presentationsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function PresentationsPage() {
  const { toast } = useApp();
  const [salespersons, setSalespersons] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loadingPresentations, setLoadingPresentations] = useState(false);
  
  const [uploading, setUploading] = useState(false);

  // Load sales personnel
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await usersApi.list({ role: 'sales' });
      setSalespersons(res.data || []);
    } catch (e) {
      toast('Failed to load salespersons');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPresentations = async (userId) => {
    setLoadingPresentations(true);
    try {
      const res = await presentationsApi.getBySalesperson(userId);
      setPresentations(res.data || []);
    } catch (e) {
      toast('Failed to load presentations');
    } finally {
      setLoadingPresentations(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    loadPresentations(user._id);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    setUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      let pptUrl = `https://mock-ppt-server.com/uploads/${file.name}`;
      
      // If Cloudinary is configured, upload for real
      if (cloudName && uploadPreset) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          pptUrl = uploadData.secure_url;
        } else {
          throw new Error('Cloudinary upload failed');
        }
      } else {
        // Mock delay
        await new Promise(r => setTimeout(r, 1500));
      }

      // Save to backend
      const res = await presentationsApi.addPpt(selectedUser._id, {
        title: file.name,
        url: pptUrl
      });
      
      // Update selectedUser ppts list
      setSelectedUser({ ...selectedUser, ppts: res.data });
      toast('✅ PPT Uploaded Successfully');
    } catch (e) {
      console.error(e);
      toast('Failed to upload PPT');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDeletePpt = async (pptId) => {
    if (!window.confirm('Delete this PPT?')) return;
    try {
      const res = await presentationsApi.deletePpt(selectedUser._id, pptId);
      setSelectedUser({ ...selectedUser, ppts: res.data });
      toast('Deleted');
    } catch (e) {
      toast('Delete failed');
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const handleDeletePresentation = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this presentation recording?')) return;
    try {
      await presentationsApi.deletePresentation(id);
      setPresentations(presentations.filter(p => p._id !== id));
      toast('✅ Presentation Deleted');
    } catch (e) {
      toast('Failed to delete presentation');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 100px)' }}>
      {/* Sidebar: List of Salespersons */}
      <div style={{ width: 300, background: 'var(--card-bg)', borderRadius: 8, padding: 16, border: '1px solid var(--border)', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: 16 }}>Sales Team</h3>
        {loadingUsers ? <p>Loading...</p> : salespersons.map(u => (
          <div 
            key={u._id} 
            onClick={() => handleSelectUser(u)}
            style={{ 
              padding: '12px', 
              borderRadius: 8, 
              cursor: 'pointer',
              marginBottom: 8,
              background: selectedUser?._id === u._id ? 'var(--p-light)' : 'transparent',
              border: '1px solid',
              borderColor: selectedUser?._id === u._id ? 'var(--p)' : 'transparent'
            }}
          >
            <strong>{u.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--mu)' }}>{u.email}</div>
          </div>
        ))}
        {!loadingUsers && salespersons.length === 0 && (
          <p style={{ color: 'var(--mu)' }}>No salespersons found.</p>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        {!selectedUser ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--mu)' }}>
            Select a salesperson from the list to view their presentations.
          </div>
        ) : (
          <>
            {/* PPT Upload Section */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>Assigned PPTs for {selectedUser.name}</h3>
                <div>
                  <input 
                    type="file" 
                    id="ppt-upload" 
                    style={{ display: 'none' }} 
                    accept=".ppt,.pptx,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="ppt-upload" className="btn btn-p" style={{ cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? 'Uploading...' : '+ Upload PPT'}
                  </label>
                </div>
              </div>

              {selectedUser.ppts && selectedUser.ppts.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedUser.ppts.map(ppt => (
                    <li key={ppt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong>{ppt.title}</strong>
                        <div style={{ fontSize: 12, color: 'var(--mu)' }}>{fd(ppt.uploadedAt)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={ppt.url} target="_blank" rel="noreferrer" className="btn btn-sm">View</a>
                        <button className="btn btn-sm btn-r" onClick={() => handleDeletePpt(ppt._id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--mu)' }}>No PPTs assigned to this user yet.</p>
              )}
            </div>

            {/* Audio Recordings Section */}
            <div className="card" style={{ padding: 20, flex: 1 }}>
              <h3 style={{ marginBottom: 16 }}>Audio Recordings</h3>
              {loadingPresentations ? (
                <p>Loading recordings...</p>
              ) : presentations.length === 0 ? (
                <p style={{ color: 'var(--mu)' }}>No presentations recorded by this user yet.</p>
              ) : (
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Selfie</th>
                        <th>Duration</th>
                        <th>Recording</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presentations.map(p => (
                        <tr key={p._id}>
                          <td>
                            <strong>{p.customerName}</strong>
                            <div style={{ fontSize: 12, color: 'var(--mu)' }}>{p.customerCompany || 'N/A'}</div>
                          </td>
                          <td>{fd(p.createdAt)}</td>
                          <td>
                            {p.location ? (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${p.location.latitude},${p.location.longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--p)' }}>
                                View Map
                              </a>
                            ) : (
                              <span style={{ color: 'var(--mu)' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            {p.selfieUrl ? (
                              <a href={p.selfieUrl} target="_blank" rel="noreferrer">
                                <img src={p.selfieUrl} alt="Selfie" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 20 }} />
                              </a>
                            ) : (
                              <span style={{ color: 'var(--mu)' }}>No Image</span>
                            )}
                          </td>
                          <td>{formatDuration(p.duration)}</td>
                          <td>
                            {p.audioUrl ? (
                              <audio controls src={p.audioUrl} style={{ height: 32, maxWidth: 200 }} />
                            ) : (
                              <span style={{ color: 'var(--mu)' }}>No Audio</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-r" onClick={() => handleDeletePresentation(p._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
