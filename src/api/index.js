/**
 * API service wrappers per entity.
 * Add new entity functions here as developer builds out pages.
 */
import api from './client';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword })
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  hierarchy: () => api.get('/users/hierarchy'),
  rate: (id, rating) => api.post(`/users/${id}/rate`, { rating }),
  grantLeave: (id, data) => api.post(`/users/${id}/leave`, data),
  resign: (id, data) => api.post(`/users/${id}/resign`, data),
  shiftDept: (id, data) => api.post(`/users/${id}/shift-department`, data),
  adminChangePassword: (id, newPassword) =>
    api.post(`/users/${id}/admin-change-password`, { newPassword }),
  setActive: (id, active) => api.post(`/users/${id}/set-active`, { active })
};

export const fulfillmentApi = {
  list: (params) => api.get('/fulfillments', { params }),
  get: (id) => api.get(`/fulfillments/${id}`),
  stats: () => api.get('/fulfillments/stats'),
};

export const clientsApi = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  createTapifyProfile: (id, data) => api.post(`/clients/${id}/create-tapify-profile`, data),
};

export const meetingsApi = {
  list: (params) => api.get('/meetings', { params }),
  upcoming: () => api.get('/meetings/upcoming'),
  get: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  start: (id) => api.post(`/meetings/${id}/start`),
  end: (id) => api.post(`/meetings/${id}/end`),
  setOutcome: (id, data) => api.post(`/meetings/${id}/outcome`, data),
  feedback: (id, data) => api.post(`/meetings/${id}/feedback`, data),
  reschedule: (id, data) => api.post(`/meetings/${id}/reschedule`, data),
  payment: (id, data) => api.post(`/meetings/${id}/payment`, data)
};

export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  convert: (id) => api.post(`/leads/${id}/convert`),
  bulkUpload: (leads, assignedTMS) => api.post('/leads/bulk', { leads, assignedTMS }),
  assign: (id, data) => api.post(`/leads/${id}/assign`, data),
  // Admin/HR: leads captured from Facebook/Instagram Lead Ads.
  campaign: (params) => api.get('/leads/campaign', { params }),
  // Admin/HR: import a Facebook Lead Ads CSV export (raw file text).
  importFbCsv: (csv) => api.post('/leads/import-fb-csv', { csv })
};

export const callsApi = {
  list: (params) => api.get('/calls', { params }),
  create: (data) => api.post('/calls', data),
  update: (id, data) => api.put(`/calls/${id}`, data),
  delete: (id) => api.delete(`/calls/${id}`)
};

export const dealsApi = {
  list: (params) => api.get('/deals', { params }),
  stats: (month) => api.get('/deals/stats', { params: { month } })
};

export const couponsApi = {
  list: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  validate: (code, dealAmount) => api.post('/coupons/validate', { code, dealAmount })
};

export const targetsApi = {
  list: (params) => api.get('/targets', { params }),
  set: (data) => api.post('/targets', data),
  bulk: (targets) => api.post('/targets/bulk', { targets }),
  carryForward: (fromMonth, toMonth) => api.post('/targets/carry-forward', { fromMonth, toMonth }),
  incentive: (userId, month) => api.get(`/targets/incentive/${userId}`, { params: { month } })
};

export const locationsApi = {
  list: () => api.get('/locations'),
  update: (data) => api.post('/locations/update', data),
  // A user's route history for a day. params: { from, to } (ISO strings).
  history: (userId, params) => api.get(`/locations/history/${userId}`, { params })
};

export const notifsApi = {
  list: (unread) => api.get('/notifications', { params: { unread } }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  // to: 'all' | role | userId. Backend persists + pushes to the recipient(s).
  send: (data) => api.post('/notifications', data),
  listScheduled: () => api.get('/notifications/scheduled'),
  cancelScheduled: (id) => api.delete(`/notifications/scheduled/${id}`),
  // Set a whole month's schedule in one go: { month: 'YYYY-MM', days: [1..31], time: 'HH:MM', title, msg, to, toName }.
  monthly: (data) => api.post('/notifications/monthly', data),
  // Existing scheduled instances within a given month (for the preview list).
  listMonth: (month) => api.get('/notifications/monthly', { params: { month } })
};

export const reportsApi = {
  overview: () => api.get('/reports/overview'),
  sales: () => api.get('/reports/sales'),
  revenue: (params) => api.get('/reports/revenue', { params }),
  conversion: () => api.get('/reports/conversion')
};

export const attendanceApi = {
  my: (month) => api.get('/attendance/my', { params: { month } }),
  list: (params) => api.get('/attendance', { params }),
  // Every active employee with today's presence status (absentees included).
  roster: (date) => api.get('/attendance/roster', { params: { date } }),
  punchIn: (data) => api.post('/attendance/punch-in', data),
  punchOut: (data) => api.post('/attendance/punch-out', data),
  lateStaff: (month) => api.get('/attendance/late-staff', { params: { month } })
};

export const fieldVisitsApi = {
  list: (params) => api.get('/field-visits', { params }),
  create: (data) => api.post('/field-visits', data),
  convertToLead: (id) => api.post(`/field-visits/${id}/convert-to-lead`)
};

export const settingsApi = {
  getBrand: () => api.get('/settings/brand'),
  updateBrand: (data) => api.put('/settings/brand', data)
};

export const profileApi = {
  me: () => api.get('/profile/me'),
  update: (data) => api.put('/profile/me', data),
  uploadPhoto: (photo) => api.post('/profile/me/photo', { photo }),
  uploadDoc: (docType, data) => api.post('/profile/me/documents', { docType, data }),
  salarySlip: (month) => api.get('/profile/me/salary-slip', { params: { month } }),
  viewUser: (userId) => api.get(`/profile/${userId}`)
};

export const chatApi = {
  conversations: () => api.get('/chat/conversations'),
  messages: (chatId, params) => api.get(`/chat/messages/${chatId}`, { params }),
  send: (data) => api.post('/chat/send', data),
  markRead: (chatId) => api.post(`/chat/${chatId}/read`),
  clear: (chatId) => api.delete(`/chat/${chatId}`),
  groups: () => api.get('/chat/groups'),
  createGroup: (data) => api.post('/chat/groups', data)
};

export const appointmentsApi = {
  list: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  autoAssign: (id) => api.post(`/appointments/${id}/auto-assign`)
};

export const permissionsApi = {
  get: (userId) => api.get(`/permissions/${userId}`),
  update: (userId, perms) => api.put(`/permissions/${userId}`, { perms }),
  reset: (userId) => api.post(`/permissions/${userId}/reset`)
};

export const regionsApi = {
  list: () => api.get('/regions'),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  delete: (id) => api.delete(`/regions/${id}`)
};

export const presentationsApi = {
  // Save a recording made by the current user (salesperson).
  create: (data) => api.post('/presentations', data),
  // The logged-in user's own recordings.
  getMy: () => api.get('/presentations/my'),
  getBySalesperson: (id) => api.get(`/presentations/${id}`),
  addPpt: (salespersonId, data) => api.post(`/presentations/ppt/${salespersonId}`, data),
  deletePpt: (salespersonId, pptId) => api.delete(`/presentations/ppt/${salespersonId}/${pptId}`),
  deletePresentation: (id) => api.delete(`/presentations/${id}`)
};

export const membershipApi = {
  send: (data) => api.post('/membership/send', data)
};

export const tapifyWelcomeApi = {
  send: (data) => api.post('/tapify-welcome/send', data)
};

// WhatsApp Business API — send / bulk / templates / conversations (mirrors app).
export const whatsappApi = {
  send: (data) => api.post('/whatsapp/send', data).then(r => r.data),
  sendBulk: (data) => api.post('/whatsapp/bulk', data).then(r => r.data),
  templates: () => api.get('/whatsapp/templates').then(r => r.data),
  conversations: () => api.get('/whatsapp/conversations').then(r => r.data),
  thread: (phone) => api.get('/whatsapp/thread/' + encodeURIComponent(phone)).then(r => r.data)
};

// Payroll — salary structures + payslips.
export const payrollApi = {
  // HR: list employees + whether their salary structure is set.
  employees: () => api.get('/payroll/employees'),
  // Salary structure (fill once). GET works for HR or the owning employee.
  getStructure: (userId) => api.get(`/payroll/structure/${userId}`),
  saveStructure: (userId, data) => api.put(`/payroll/structure/${userId}`, data),
  // Payslips. list() → HR all (optional userId); employee → own.
  listPayslips: (userId) => api.get('/payroll/payslips', { params: userId ? { userId } : {} }),
  // Admin/HR: total salary spend grouped by month. Optional { year } or { month }.
  salarySpend: (params) => api.get('/payroll/salary-spend', { params }),
  getPayslip: (id) => api.get(`/payroll/payslips/${id}`),
  createPayslip: (data) => api.post('/payroll/payslips', data),
  payslipPdf: (id) => api.get(`/payroll/payslips/${id}/pdf`), // { filename, base64 }
  deletePayslip: (id) => api.delete(`/payroll/payslips/${id}`)
};

// Leave requests.
export const leavesApi = {
  // Apply for leave. data: { leaveType, fromDate, toDate, reason }
  apply: (data) => api.post('/leaves', data),
  // Own leave history (any role).
  my: () => api.get('/leaves/my'),
  // Withdraw a still-pending request of your own.
  cancel: (id) => api.post(`/leaves/${id}/cancel`),
  // Admin/HR: every request in the company. params: { status? }
  list: (params) => api.get('/leaves', { params }),
  approve: (id) => api.post(`/leaves/${id}/approve`),
  reject: (id, note) => api.post(`/leaves/${id}/reject`, { note })
};

// HR dashboard aggregates.
export const hrDashboardApi = {
  stats: (month) => api.get('/hr-dashboard/stats', { params: { month } })
};

// New Clients — digital-card onboarding + help/support requests captured over WhatsApp.
export const newClientsApi = {
  list: (params) => api.get('/new-clients', { params }),
  update: (id, data) => api.patch(`/new-clients/${id}`, data),
  remove: (id) => api.delete(`/new-clients/${id}`)
};

// Sales presentation decks — admin/HR upload a PDF and assign it to sales staff.
export const salesDecksApi = {
  list: () => api.get('/sales-decks'),
  create: (data) => api.post('/sales-decks', data),
  update: (id, data) => api.put(`/sales-decks/${id}`, data),
  remove: (id) => api.delete(`/sales-decks/${id}`)
};
