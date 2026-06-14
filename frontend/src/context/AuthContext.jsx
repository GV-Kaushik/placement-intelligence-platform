import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create the context
const AuthContext = createContext();

// Create the Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error("Token verification failed, logging out", err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Register handler
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Update profile / target company handler
  const updateProfile = async (updates) => {
    const res = await api.put('/auth/me', updates);
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context easily
export const useAuth = () => useContext(AuthContext);