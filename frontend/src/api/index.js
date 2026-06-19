// index.js
import api from './axios'

// AUTH
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data.data)

export const logout = () => api.post('/auth/logout')

// MEMBERS
export const getMembers = (params) =>
  api.get('/members', { params }).then(r => r.data)

export const getMemberById = (id) =>
  api.get(`/members/${id}`).then(r => r.data.data)

export const getMemberByCard = (cardNumber) =>
  api.get(`/members/card/${cardNumber}`).then(r => r.data.data)

export const registerMember = (data) =>
  api.post('/members/register', data).then(r => r.data.data)

export const updateMember = (id, data) =>
  api.put(`/members/${id}`, data).then(r => r.data.data)

export const updateMemberStatus = (id, status, reason) =>
  api.patch(`/members/${id}/status`, { status, reason }).then(r => r.data)

// MEMBERSHIP
export const getLevels = () =>
  api.get('/membership/levels').then(r => r.data.data)

export const getMemberMembership = (memberId) =>
  api.get(`/membership/${memberId}`).then(r => r.data.data)

// POINTS
export const earnPoints = (data) =>
  api.post('/points/earn', data).then(r => r.data.data)

export const getBalance = (memberId) =>
  api.get(`/points/${memberId}/balance`).then(r => r.data.data)

export const getPointsHistory = (memberId, params) =>
  api.get(`/points/${memberId}/history`, { params }).then(r => r.data)

export const adjustPoints = (memberId, delta, reason) =>
  api.post(`/points/${memberId}/adjust`, { delta, reason }).then(r => r.data.data)

// BENEFITS
export const getBenefits = (params) =>
  api.get('/benefits', { params }).then(r => r.data.data)

export const createBenefit = (data) =>
  api.post('/benefits', data).then(r => r.data.data)

export const updateBenefit = (id, data) =>
  api.put(`/benefits/${id}`, data).then(r => r.data.data)

export const deleteBenefit = (id) =>
  api.delete(`/benefits/${id}`)

// REDEMPTIONS
export const redeemBenefit = (data) =>
  api.post('/redemptions', data).then(r => r.data.data)

export const getRedemptionHistory = (memberId, params) =>
  api.get(`/redemptions/${memberId}/history`, { params }).then(r => r.data)

// MERCHANDISE
export const getMerchandise = () =>
  api.get('/merchandise').then(r => r.data.data)

export const deliverMerchandise = (data) =>
  api.post('/merchandise/deliver', data).then(r => r.data.data)

export const updateStock = (id, delta) =>
  api.patch(`/merchandise/${id}/stock`, { delta }).then(r => r.data.data)

// POS
export const posLookup = (cardNumber) =>
  api.post('/pos/lookup', { cardNumber }).then(r => r.data.data)

export const posTransaction = (data) =>
  api.post('/pos/transaction', data).then(r => r.data.data)

// REPORTS
export const getKpi = (params) =>
  api.get('/reports/kpi', { params }).then(r => r.data.data)

export const getMemberGrowth = (year) =>
  api.get('/reports/member-growth', { params: { year } }).then(r => r.data.data)

export const getTransactionReport = (params) =>
  api.get('/reports/transactions', { params }).then(r => r.data.data)

export const getStockReport = () =>
  api.get('/reports/merchandise-stock').then(r => r.data.data)

// ADMIN
export const getConfig = () =>
  api.get('/admin/config').then(r => r.data.data)

export const upsertConfig = (key, value, description) =>
  api.put(`/admin/config/${key}`, { value, description }).then(r => r.data)

export const getAuditLogs = (params) =>
  api.get('/admin/audit-logs', { params }).then(r => r.data)

export const getStaff = () =>
  api.get('/admin/staff').then(r => r.data.data)

export const createStaff = (data) =>
  api.post('/admin/staff', data).then(r => r.data.data)

export const toggleStaffStatus = (userId) =>
  api.patch(`/admin/staff/${userId}/toggle-status`).then(r => r.data.data)

// PROMOTIONS
export const getPromotions = () =>
  api.get('/promotions').then(r => r.data.data)

export const getPromotionById = (id) =>
  api.get(`/promotions/${id}`).then(r => r.data.data)

export const createPromotion = (data) =>
  api.post('/promotions', data).then(r => r.data.data)

export const updatePromotion = (id, data) =>
  api.put(`/promotions/${id}`, data).then(r => r.data.data)

export const deletePromotion = (id) =>
  api.delete(`/promotions/${id}`)

// NOTIFICATIONS - Member authenticated (uses rc_member_token from localStorage)
function memberApi() {
  const token = localStorage.getItem('rc_member_token');
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

export const markNotificationAsReadMember = (id) =>
  api.patch(`/notifications/${id}/read-member`, {}, memberApi()).then(r => r.data)

export const markAllNotificationsAsReadMember = () =>
  api.patch('/notifications/read-all-member', {}, memberApi()).then(r => r.data)
