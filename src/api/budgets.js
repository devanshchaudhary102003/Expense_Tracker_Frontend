import api from './client';

export const budgetApi = {
  list: () => api.get('/api/budgets'),
  get: (id) => api.get(`/api/budgets/${id}`),
  create: (payload) => api.post('/api/budgets', payload),
  update: (id, payload) => api.put(`/api/budgets/${id}`, payload),
  remove: (id) => api.delete(`/api/budgets/${id}`),
  active: () => api.get('/api/budgets/active'),
  alerts: () => api.get('/api/budgets/alerts'),
  utilization: () => api.get('/api/budgets/utilization'),

  // Manual sync — re-pulls SpentAmount from ExpenseService for one budget.
  // Useful right after creating a budget mid-period or whenever the user suspects
  // the SpentAmount has drifted (e.g. messages dropped because RabbitMQ was down).
  recompute: (id) => api.post(`/api/budgets/${id}/recompute`),

  // Same as above but for every one of the user's budgets in a single call.
  recomputeAll: () => api.post('/api/budgets/recompute-all'),
};

