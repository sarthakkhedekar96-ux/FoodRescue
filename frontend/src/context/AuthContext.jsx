import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

// SECURITY NOTE ON JWT STORAGE:
// Storing JWT tokens in localStorage makes them susceptible to extraction via Cross-Site Scripting (XSS).
// In enterprise/high-security environments, storing tokens in httpOnly, Secure, SameSite cookies is recommended
// to prevent JavaScript access. For this single-page application and demonstration architecture,
// localStorage provides standard client-side state persistence across page refreshes.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('foodrescue_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodrescue_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If token exists, verify with backend /api/auth/me
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('foodrescue_token');
      if (savedToken) {
        try {
          const freshUser = await api.getCurrentUser();
          setUser(freshUser);
          localStorage.setItem('foodrescue_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed:', err.message);
          if (err.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();

    // Listen for 401 unauthorized events dispatched from api.js
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res?.token && res?.user) {
      localStorage.setItem('foodrescue_token', res.token);
      localStorage.setItem('foodrescue_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid login response from server');
  };

  const register = async (data) => {
    const res = await api.register(data);
    if (res?.token && res?.user) {
      localStorage.setItem('foodrescue_token', res.token);
      localStorage.setItem('foodrescue_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid registration response from server');
  };

  const logout = () => {
    localStorage.removeItem('foodrescue_token');
    localStorage.removeItem('foodrescue_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
