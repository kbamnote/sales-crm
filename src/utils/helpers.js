/**
 * Helpers ported from V8.html (fd, fdt, fmt, pct, stars, etc.)
 */

export const today = () => new Date().toISOString().split('T')[0];
export const nowTs = () => new Date().toISOString();
export const curMonth = () => new Date().toISOString().slice(0, 7);

export const fd = (d) => {
  try {
    const date = (d || '').toString().includes('T') ? d : d + 'T00:00:00';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return d || '-'; }
};

export const fdt = (d) => {
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch { return d || '-'; }
};

export const fmt = (n, currency = '₹') =>
  currency + (+n || 0).toLocaleString('en-IN');

export const pct = (a, t) =>
  t ? Math.min(100, Math.round((a / t) * 100)) : 0;

export const stars = (r) =>
  '★'.repeat(Math.round(r || 0)) + '☆'.repeat(5 - Math.round(r || 0));

export const roleColor = {
  admin: '#EF4444', manager: '#8B5CF6', bdo: '#3B82F6',
  team_leader: '#F59E0B', sales: '#10B981',
  tms: '#06B6D4', tme: '#06B6D4', hr: '#EC4899'
};

export const roleLabel = {
  admin: 'Administrator', manager: 'Manager', bdo: 'BDO',
  team_leader: 'Team Leader', sales: 'Sales Executive',
  tms: 'TMS Agent', tme: 'TME', hr: 'Senior HR',
  telecaller: 'Telecaller', designer: 'Designer', social_media: 'Social Media Manager'
};

export const getTargetMeta = (role) => {
  if (role === 'tme') return { unit: 'appointments', label: 'Appointment Target', icon: '🗓️' };
  if (role === 'telecaller') return { unit: 'appointments', label: 'Appointments / month (with clients)', icon: '🗓️' };
  if (role === 'hr') return { unit: 'hirings', label: 'Hiring Target', icon: '👥' };
  if (role === 'tms') return { unit: 'calls', label: 'Call Target', icon: '📞' };
  return { unit: 'revenue', label: 'Revenue Target', icon: '💰' };
};

export const fmtTarget = (val, role, currency = '₹') => {
  const m = getTargetMeta(role);
  return m.unit === 'revenue' ? fmt(val, currency) : (val || 0) + ' ' + m.unit;
};
