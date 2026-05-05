import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ss_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [loading, setLoading] = useState(false);

  const persist = useCallback((authResp) => {
    // authResp: { userId, fullName, email, role, currency, token, expiresAt }
    const u = {
      userId: authResp.userId,
      fullName: authResp.fullName,
      email: authResp.email,
      role: authResp.role,
      currency: authResp.currency,
      expiresAt: authResp.expiresAt,
    };
    localStorage.setItem('ss_token', authResp.token);
    localStorage.setItem('ss_user', JSON.stringify(u));
    setToken(authResp.token);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      persist(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(payload);
      persist(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      const u = {
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        currency: data.currency,
      };
      localStorage.setItem('ss_user', JSON.stringify(u));
      setUser(u);
    } catch {
      // ignore — request interceptor handles 401s
    }
  }, []);

  // Set token from a Google OAuth callback (token is in URL).
  const acceptToken = useCallback(async (jwt) => {
    localStorage.setItem('ss_token', jwt);
    setToken(jwt);
    // Fetch the actual user profile to populate state.
    const { data } = await authApi.me();
    const u = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      currency: data.currency,
    };
    localStorage.setItem('ss_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  // On mount, if we have a token but no user, try fetching profile.
  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'Admin',
    login,
    register,
    logout,
    refreshUser,
    acceptToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
