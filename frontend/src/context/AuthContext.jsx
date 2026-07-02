import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create the context
const AuthContext = createContext();

// Create the Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Stores the currently authenticated user object (id, email, name, role) or null if logged out
  const [loading, setLoading] = useState(true);  // Boolean flag to show full page spinner on load while verifying the user's JWT token

  // Check if user is logged in on page load
  useEffect(() => {
    async function checkLoggedIn() {
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
  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Google Login handler
  async function googleLogin(idToken) {
    const res = await api.post('/auth/google', { idToken });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Register handler
  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Logout handler
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Update profile / target company handler
  async function updateProfile(updates) {
    const res = await api.put('/auth/me', updates);
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context easily
export function useAuth() {
  return useContext(AuthContext);
}