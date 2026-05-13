import api from './client';

export const categoryApi = {
  list: () => api.get('/api/categories'),
  get: (id) => api.get(`/api/categories/${id}`),
  defaults: () => api.get('/api/categories/defaults'),
  byType: (type) => api.get(`/api/categories/type/${type}`), // EXPENSE | INCOME
  create: (payload) => api.post('/api/categories', payload),
  update: (id, payload) => api.put(`/api/categories/${id}`, payload),
  deactivate: (id) => api.put(`/api/categories/${id}/deactivate`),
  activate: (id) => api.put(`/api/categories/${id}/activate`),
  remove: (id) => api.delete(`/api/categories/${id}`),
};
