"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginPin: (pin: string) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    const localToken = localStorage.getItem('auth_token');

    const token = localToken || cookieToken;

    // Sync from cookie to localStorage if missing
    if (cookieToken && !localToken) {
      localStorage.setItem('auth_token', cookieToken);
    }

    if (token) {
      apiClient.setToken(token);
      // Always refresh the cookie to ensure it's valid
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error instanceof Error && /401/.test(error.message)) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loginPin = async (pin: string) => {
    try {
      const response = await apiClient.loginPin({ pin });
      setUser(response.user);
      apiClient.setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const loginEmail = async (email: string, password: string) => {
    try {
      const response = await apiClient.loginEmail({ email, password });
      setUser(response.user);

      apiClient.setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiClient.register(userData);
      setUser(response.user);

      apiClient.setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    apiClient.removeToken();
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    loginPin,
    loginEmail,
    register,
    logout,
    updateUser,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
