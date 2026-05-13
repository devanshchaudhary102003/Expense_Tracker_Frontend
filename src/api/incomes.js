import api from './client';

export const incomeApi = {
  list: () => api.get('/api/incomes'),
  get: (id) => api.get(`/api/incomes/${id}`),
  create: (payload) => api.post('/api/incomes', payload),
  update: (id, payload) => api.put(`/api/incomes/${id}`, payload),
  remove: (id) => api.delete(`/api/incomes/${id}`),
  bySource: (source) => api.get(`/api/incomes/source/${source}`),
  byDateRange: (start, end) => api.get('/api/incomes/filter', { params: { start, end } }),
  recurring: () => api.get('/api/incomes/recurring'),
  total: () => api.get('/api/incomes/total'),
  totalBySource: (source) => api.get(`/api/incomes/total/source/${source}`),
  netBalance: () => api.get('/api/incomes/net-balance'),
};
