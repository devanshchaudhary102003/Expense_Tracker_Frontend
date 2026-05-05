import api from './client';

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  me: () => api.get('/api/auth/me'),
  updateProfile: (payload) => api.put('/api/auth/profile', payload),
  changePassword: (payload) => api.put('/api/auth/change-password', payload),
  deactivate: () => api.delete('/api/auth/deactivate'),
  // Admin
  getAllUsers: () => api.get('/api/auth/users'),
  getUser: (id) => api.get(`/api/auth/users/${id}`),
  deleteUser: (id) => api.delete(`/api/auth/users/${id}`),
  updateUserRole: (id, role) => api.put(`/api/auth/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.put(`/api/auth/users/${id}/status`, { isActive }),
  adminStats: () => api.get('/api/auth/admin/stats'),
  // Google OAuth: redirect to AuthService DIRECTLY (not gateway), since the
  // OAuth callback (`/signin-google`) needs to land back on the AuthService host.
  // The backend redirects to `${returnUrl}?token=<jwt>` after Google completes.
  // Override with VITE_AUTH_BASE_URL if AuthService is on a different host.
  googleLoginUrl: (returnUrl) => {
    const authBase = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:5039';
    const ret = encodeURIComponent(returnUrl || `${window.location.origin}/oauth-callback`);
    return `${authBase}/api/auth/google-login?returnUrl=${ret}`;
  },
};
