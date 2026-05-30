import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getNavForRole } from '../utils/nav';
import { roleLabel } from '../utils/helpers';

export default function Sidebar({ mini, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const { brand } = useApp();

  // Group nav items by section (sec field)
  const navGroups = useMemo(() => {
    const items = getNavForRole(user?.role || 'sales');
    const groups = [];
    let current = { label: null, items: [] };
    items.forEach(item => {
      if (item.sec) {
        if (current.items.length) groups.push(current);
        current = { label: item.sec, items: [item] };
      } else {
        current.items.push(item);
      }
    });
    if (current.items.length) groups.push(current);
    return groups;
  }, [user]);

  return (
    <aside
      className={`sidebar ${mini ? 'mini' : ''} ${mobileOpen ? 'mob-open' : ''}`}
      style={{ background: brand.sidebarColor || '#1E293B' }}
    >
      <div className="sb-logo">
        <div className="sb-mark">
          {brand.logo
            ? <img src={brand.logo} alt="logo" />
            : <span>🎯</span>}
        </div>
        <div className="sb-info">
          <h1>{brand.name || 'SalesCRM Pro'}</h1>
          <small>{brand.tagline || 'Sales Force Manager'}</small>
        </div>
      </div>

      <nav className="snav">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && <div className="sg">{group.label}</div>}
            {group.items.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `si ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
              >
                <span className="ic">{item.ic}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sfooter">
        <div className="susr">
          <div className="sav">{user?.avatar || user?.name?.slice(0, 2).toUpperCase() || 'U'}</div>
          <div className="susr-info">
            <div className="sn">{user?.name}</div>
            <div className="sr">{roleLabel[user?.role] || user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
