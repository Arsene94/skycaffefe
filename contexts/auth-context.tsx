// context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  role?: string | null;
  // poți adăuga addresses, totalOrders etc. dacă ai nevoie în UI
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginPin: (pin: string) => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    label?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncTokenFromCookie = () => {
    const cookieToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(r => r.startsWith('auth_token='))?.split('=')[1]
        : null;

    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const token = localToken || cookieToken || null;

    if (cookieToken && !localToken && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', cookieToken);
    }
    if (token) {
      apiClient.setToken(token);
      // reîmprospătăm cookie 7 zile
      if (typeof document !== 'undefined') {
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      }
    }
    return token;
  };

  const mapProfileToUser = (p: any): User => ({
    id: String(p.id),
    name: p.name ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    role: p.role ?? null,
  });

  const refreshProfile = useCallback(async () => {
    try {
      const prof = await apiClient.getProfile();
      setUser(mapProfileToUser(prof));
    } catch (err) {
      console.warn('Failed to load profile', err);
      setUser(null);
      // dacă token invalid, îl curățăm
      await logout();
    }
  }, []);

  useEffect(() => {
    const token = syncTokenFromCookie();
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await refreshProfile();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const afterAuth = (resp: { access_token: string; user: any }) => {
    const token = resp.access_token;
    apiClient.setToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
    setUser(mapProfileToUser(resp.user));
  };

  const loginPin = async (pin: string) => {
    const resp = await apiClient.loginPin({ pin });
    afterAuth(resp);
  };

  const loginEmail = async (email: string, password: string) => {
    const resp = await apiClient.loginEmail({ email, password });
    afterAuth(resp);
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    label?: string;
  }) => {
    const resp = await apiClient.register(userData);
    afterAuth(resp);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore
    } finally {
      apiClient.removeToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      if (typeof document !== 'undefined') {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...userData } : prev));
  };

  const value: AuthContextType = {
    user,
    loading,
    loginPin,
    loginEmail,
    register,
    logout,
    updateUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
