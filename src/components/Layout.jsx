import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarMini, setSidebarMini] = useState(false);
  const [sidebarMobile, setSidebarMobile] = useState(false);

  return (
    <div className="layout">
      <div
        className={`sb-overlay ${sidebarMobile ? 'show' : ''}`}
        onClick={() => setSidebarMobile(false)}
      />
      <Sidebar
        mini={sidebarMini}
        mobileOpen={sidebarMobile}
        onCloseMobile={() => setSidebarMobile(false)}
      />
      <div className={`main ${sidebarMini ? 'mini' : ''}`}>
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth < 768) setSidebarMobile(!sidebarMobile);
            else setSidebarMini(!sidebarMini);
          }}
        />
        <div className="content" id="CT">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
