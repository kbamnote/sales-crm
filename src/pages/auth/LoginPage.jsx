import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const { toast } = useApp();
  const [email, setEmail] = useState('admin@co.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    const dest = location.state?.from?.pathname || '/';
    navigate(dest, { replace: true });
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      toast(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div className="login-box" style={{
        background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28
          }}>🎯</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>SalesCRM Pro</h1>
          <small style={{ color: '#64748B' }}>Sales Force Manager</small>
        </div>

        <form onSubmit={onSubmit}>
          <div className="fg" style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #CBD5F0', borderRadius: 8, fontSize: 13
              }}
            />
          </div>
          <div className="fg" style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #CBD5F0', borderRadius: 8, fontSize: 13
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-p"
            disabled={loading}
            style={{ width: '100%', padding: '11px', fontSize: 13 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 16, padding: 12, background: '#F0F4FF', borderRadius: 8,
          fontSize: 11, color: '#64748B'
        }}>
          <strong>Demo accounts:</strong><br />
          admin@co.com / admin (Admin)<br />
          wasim@co.com / 1234 (Manager)<br />
          purushottam@co.com / 1234 (Sales)
        </div>
      </div>
    </div>
  );
}
