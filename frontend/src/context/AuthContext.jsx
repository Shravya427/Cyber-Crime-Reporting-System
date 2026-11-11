import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cyber_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cyber_jwt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('cyber_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    }

    verifyAuth();

    const handleExpired = () => {
      logout();
    };
    window.addEventListener('auth_expired', handleExpired);
    return () => window.removeEventListener('auth_expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cyber_jwt_token', newToken);
    localStorage.setItem('cyber_user', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cyber_jwt_token', newToken);
    localStorage.setItem('cyber_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cyber_jwt_token');
    localStorage.removeItem('cyber_user');
  };

  const quickDemoLogin = async (role) => {
    const credentials = {
      admin: { email: 'admin@cybercell.gov.in', password: 'Admin@123' },
      officer: { email: 'officer.sharma@cybercell.gov.in', password: 'Officer@123' },
      citizen: { email: 'rahul.mehta@gmail.com', password: 'Citizen@123' }
    };

    if (!credentials[role]) throw new Error("Invalid demo role");
    return await login(credentials[role].email, credentials[role].password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
