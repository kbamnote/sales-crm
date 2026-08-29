/**
 * Navigation items — ported from NAVDEF in V8.html.
 * Each item maps to a route + role list that can access it.
 */
export const NAV_ITEMS = [
  { id: 'dashboard', path: '/', ic: '📊', label: 'Dashboard',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },

  // Organization
  { id: 'hierarchy', path: '/hierarchy', ic: '🌳', label: 'Team Hierarchy',
    roles: ['admin','manager','bdo','team_leader','hr'], sec: 'Organization' },
  { id: 'team-monitor', path: '/team-monitor', ic: '🌡️', label: 'Monitor Team',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'team-map', path: '/team-map', ic: '🗺️', label: 'Team Map',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'route-history', path: '/route-history', ic: '🧭', label: 'Route History',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'live-map', path: '/live-map', ic: '📍', label: 'Live Map',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'all-targets', path: '/targets', ic: '🎯', label: 'Targets',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'coupons', path: '/coupons', ic: '🎟️', label: 'Coupon Codes',
    roles: ['admin','manager'] },

  // CRM
  { id: 'all-clients', path: '/clients', ic: '🏢', label: 'All Clients',
    roles: ['admin','manager','bdo','team_leader','hr'], sec: 'CRM' },
  { id: 'meetings', path: '/meetings', ic: '🤝', label: 'All Meetings',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'deals', path: '/deals', ic: '💰', label: 'Deals & Payments',
    roles: ['admin','manager','bdo','team_leader','sales'] },
  { id: 'fulfillment', path: '/fulfillment', ic: '📦', label: 'Order Tracking',
    roles: ['admin','manager'] },

  // Pipeline
  { id: 'leads', path: '/leads', ic: '💡', label: 'Leads',
    roles: ['admin','manager','bdo','team_leader','tms','tme','hr'], sec: 'Pipeline' },
  { id: 'calls-log', path: '/calls', ic: '📋', label: 'Calls Log',
    roles: ['admin','manager','bdo','team_leader','tms','tme','hr'] },

  // Sales/TMS personal
  { id: 'my-clients', path: '/my-clients', ic: '👤', label: 'My Clients',
    roles: ['sales'], sec: 'My Work' },
  { id: 'my-meetings', path: '/my-meetings', ic: '📅', label: 'My Meetings',
    roles: ['sales'] },
  { id: 'my-deals', path: '/my-deals', ic: '💰', label: 'My Deals',
    roles: ['sales'] },
  { id: 'field-visit', path: '/field-visit', ic: '🚗', label: 'Field Visit',
    roles: ['sales','team_leader','bdo','manager','admin'] },
  { id: 'my-target', path: '/my-target', ic: '📈', label: 'My Target',
    roles: ['sales','tms'] },
  { id: 'my-calls', path: '/my-calls', ic: '📞', label: 'My Calls',
    roles: ['tms','tme'], sec: 'My Work' },

  // Tools
  { id: 'appointments', path: '/appointments', ic: '🗓️', label: 'Appointments',
    roles: ['admin','manager','bdo','team_leader','tms','tme','hr'], sec: 'Tools' },
  { id: 'reports', path: '/reports', ic: '📊', label: 'Reports',
    roles: ['admin','manager'] },
  { id: 'notifications', path: '/notifications', ic: '🔔', label: 'Notifications',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },
  { id: 'chat', path: '/chat', ic: '💬', label: 'Chat',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },
  { id: 'attendance', path: '/attendance', ic: '⏰', label: 'Attendance',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },
  // Punch-out daily reports + Excel export. Admin/HR see everyone and can
  // export any employee or the whole team; other roles see only their own.
  { id: 'daily-reports', path: '/daily-reports', ic: '📄', label: 'Daily Reports',
    roles: ['admin','hr','manager','bdo','team_leader','sales','tms','tme','telecaller','assistant_hr'] },
  { id: 'presentations', path: '/presentations', ic: '🎤', label: 'Presentations',
    roles: ['admin','manager'], sec: 'Tools' },
  { id: 'sales-presentation', path: '/sales-presentation', ic: '🎙️', label: 'Sales Presentation',
    roles: ['sales','hr','admin'] },
  { id: 'whatsapp', path: '/whatsapp', ic: '💬', label: 'WhatsApp',
    roles: ['admin','manager','hr','sales','tms','tme'] },
  { id: 'send-membership', path: '/send-membership', ic: '🏅', label: 'Send Membership',
    roles: ['admin','manager','hr','sales'], sec: 'Tools' },
  { id: 'send-tapify-welcome', path: '/send-tapify-welcome', ic: '💌', label: 'Send Tapify Welcome',
    roles: ['admin','manager','hr','sales'], sec: 'Tools' },

  // HR
  { id: 'hr-dashboard', path: '/hr-dashboard', ic: '📊', label: 'HR Dashboard',
    roles: ['admin','manager','hr'], sec: 'HR' },
  { id: 'payroll', path: '/payroll', ic: '💰', label: 'Payroll',
    roles: ['admin','hr'] },
  { id: 'my-payslips', path: '/my-payslips', ic: '🧾', label: 'My Payslips',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },
  { id: 'leave', path: '/leave', ic: '✈️', label: 'Leave',
    roles: ['admin','manager','bdo','team_leader','sales','tms','tme','hr'] },
  { id: 'late-staff', path: '/late-staff', ic: '⏰', label: 'Late Staff',
    roles: ['admin','manager','bdo','team_leader','hr'] },
  { id: 'support', path: '/support', ic: '🛟', label: 'Support Requests',
    roles: ['admin','hr'] },
  { id: 'campaign-leads', path: '/campaign-leads', ic: '📣', label: 'Campaign Leads',
    roles: ['admin','hr'] },

  // Admin
  { id: 'company-settings', path: '/settings', ic: '⚙️', label: 'Company Settings',
    roles: ['admin'], sec: 'Admin' },
  { id: 'permissions', path: '/permissions', ic: '🔐', label: 'Permissions',
    roles: ['admin'] },
  { id: 'team-mgmt', path: '/team', ic: '👥', label: 'Manage Team',
    roles: ['admin','manager','bdo','team_leader','hr'] },
];

export const getNavForRole = (role) =>
  NAV_ITEMS.filter(item => item.roles.includes(role));
