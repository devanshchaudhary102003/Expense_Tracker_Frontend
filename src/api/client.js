import axios from 'axios';
import toast from 'react-hot-toast';

// All requests are routed through the YARP API Gateway (default port 5201).
// This base URL can be overridden via Vite env var: VITE_API_BASE_URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5201';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralised error handling.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or unauthorised — clear and bounce to login.
      const onAuthPage = ['/login', '/signup'].includes(window.location.pathname);
      if (!onAuthPage) {
        localStorage.removeItem('ss_token');
        localStorage.removeItem('ss_user');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(err);
  }
);

// Helper to extract a friendly error message.
export const errMsg = (err, fallback = 'Something went wrong') => {
  const data = err?.response?.data;
  if (typeof data === 'string') return data;
  return data?.message || data?.title || err?.message || fallback;
};

export default api;
