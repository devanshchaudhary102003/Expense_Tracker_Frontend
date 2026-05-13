import api from './client';

export const reportApi = {
  monthly: (year, month) => api.get(`/api/reports/monthly/${year}/${month}`),
  categoryBreakdown: (start, end) =>
    api.get('/api/reports/category-breakdown', { params: { start, end } }),
  trend: (months) => api.get(`/api/reports/trend/${months}`),
  savingsRate: (year, month) => api.get(`/api/reports/savings-rate/${year}/${month}`),
  yearly: (year) => api.get(`/api/reports/yearly/${year}`),
  topCategories: (limit) => api.get(`/api/reports/top-categories/${limit}`),
  myReports: () => api.get('/api/reports/my-reports'),
  remove: (id) => api.delete(`/api/reports/${id}`),
};
