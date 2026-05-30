import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../utils/nav';
import { notifsApi } from '../api';

export default function Topbar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [unread, setUnread] = useState(0);

  const currentNav = NAV_ITEMS.find(n =>
    n.path === location.pathname ||
    (n.path !== '/' && location.pathname.startsWith(n.path))
  );
  const title = currentNav?.label || 'Dashboard';

  useEffect(() => {
    let mounted = true;
    const load = () => notifsApi.list(true)
      .then(r => mounted && setUnread(r.data.length))
      .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="topbar no-print">
      <div className="tbl">
        <button
          className="btn btn-sm"
          style={{ padding: '6px 8px', fontSize: 16 }}
          onClick={onToggleSidebar}
        >☰</button>
        <h2>{title}</h2>
      </div>
      <div className="tbr">
        <button
          className="btn btn-sm no-print"
          style={{ position: 'relative' }}
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2, width: 8, height: 8,
              background: 'var(--R)', borderRadius: '50%'
            }} />
          )}
        </button>
        <button className="btn btn-sm" onClick={() => navigate('/settings')}>⚙️</button>
        <button className="btn btn-sm btn-r" onClick={onLogout} title="Logout">↪</button>
      </div>
    </div>
  );
}
