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
        localStorage.removeItem('study_token');
        setUser(null);
      }
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

  const loginAsDemo = () => {
    const defaultUser = {
      id: "demo-user-1",
      email: "alex.rivera@aistudyplanner.local",
      fullName: "Alex Rivera",
    };
    localStorage.setItem('study_user', JSON.stringify(defaultUser));
    localStorage.setItem('study_token', 'demo_token_development');
    setUser(defaultUser);
  };

  const logout = () => {
    localStorage.removeItem('study_token');
    localStorage.removeItem('study_user');
    setUser(null);
  };

  const isDemoUser = user?.id === 'demo-user-1' || user?.email?.endsWith('@aistudyplanner.local');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginAsDemo, logout, isDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
