import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('wedding_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem('wedding_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setAdmin(res.admin);
        } catch {
          api.logout();
          setToken(null);
          setAdmin(null);
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleUnauthorized = () => {
      setToken(null);
      setAdmin(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setToken(res.token);
    setAdmin(res.admin);
    return res;
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        isAuthenticated: !!token,
        loading,
        login,
        logout
      }}
    >
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

