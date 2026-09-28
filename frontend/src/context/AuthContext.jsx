import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('study_user');
    const token = localStorage.getItem('study_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('study_user');
      }
    } else {
      // Initialize with a default local demo user profile for frictionless exploration
      const defaultUser = {
        id: "demo-user-1",
        email: "student@aistudyplanner.local",
        fullName: "Alex Rivera",
      };
      localStorage.setItem('study_user', JSON.stringify(defaultUser));
      localStorage.setItem('study_token', 'demo_token_development');
      setUser(defaultUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('study_token', data.token);
      localStorage.setItem('study_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const data = await authService.register(email, password, fullName);
      localStorage.setItem('study_token', data.token);
      localStorage.setItem('study_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('study_token');
    localStorage.removeItem('study_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
