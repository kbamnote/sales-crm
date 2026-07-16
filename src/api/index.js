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
    api.post(`/users/${id}/admin-change-password`, { newPassword })
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
  assign: (id, data) => api.post(`/leads/${id}/assign`, data)
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
  update: (data) => api.post('/locations/update', data)
};

export const notifsApi = {
  list: (unread) => api.get('/notifications', { params: { unread } }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  // to: 'all' | role | userId. Backend persists + pushes to the recipient(s).
  send: (data) => api.post('/notifications', data),
  listScheduled: () => api.get('/notifications/scheduled'),
  cancelScheduled: (id) => api.delete(`/notifications/scheduled/${id}`)
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
  punchIn: (data) => api.post('/attendance/punch-in', data),
  punchOut: (data) => api.post('/attendance/punch-out', data)
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
