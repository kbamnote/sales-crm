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
  { id: 'live-map', path: '/live-map', ic: '🗺️', label: 'Live Map',
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
  { id: 'presentations', path: '/presentations', ic: '🎤', label: 'Presentations',
    roles: ['admin','manager'], sec: 'Tools' },
  { id: 'send-membership', path: '/send-membership', ic: '🏅', label: 'Send Membership',
    roles: ['admin','manager','hr','sales'], sec: 'Tools' },
  { id: 'send-tapify-welcome', path: '/send-tapify-welcome', ic: '💌', label: 'Send Tapify Welcome',
    roles: ['admin','manager','hr','sales'], sec: 'Tools' },

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
