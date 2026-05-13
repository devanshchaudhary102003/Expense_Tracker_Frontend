import api from './client';

export const notificationApi = {
  list: (limit = 50) => api.get('/api/notifications', { params: { limit } }),
  unread: () => api.get('/api/notifications/unread'),
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  remove: (id) => api.delete(`/api/notifications/${id}`),
  // Admin
  broadcast: (payload) => api.post('/api/notifications/broadcast', payload),
  create: (payload) => api.post('/api/notifications', payload),
};
