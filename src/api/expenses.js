import api from './client';

export const expenseApi = {
  list: () => api.get('/api/expenses'),
  get: (id) => api.get(`/api/expenses/${id}`),
  create: (payload) => api.post('/api/expenses', payload),
  update: (id, payload) => api.put(`/api/expenses/${id}`, payload),
  remove: (id) => api.delete(`/api/expenses/${id}`),
  byCategory: (categoryId) => api.get(`/api/expenses/category/${categoryId}`),
  byDateRange: (start, end) => api.get('/api/expenses/filter', { params: { start, end } }),
  byPaymentMode: (mode) => api.get(`/api/expenses/payment-mode/${mode}`),
  search: (q) => api.get('/api/expenses/search', { params: { q } }),
  recurring: () => api.get('/api/expenses/recurring'),
  total: () => api.get('/api/expenses/total'),
  totalByCategory: (categoryId) => api.get(`/api/expenses/total/category/${categoryId}`),
};
