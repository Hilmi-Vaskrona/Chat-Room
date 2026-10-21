'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  api,
} from './api';
import { disconnectSocket } from './socket';

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  bio?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = getToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setTokenState(savedToken);
      setUser(savedUser);
      // Verify token in background
      api.users
        .getMe()
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            setStoredUser(res.data);
          }
        })
        .catch(() => {
          // Token expired or invalid
          removeToken();
          setTokenState(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    disconnectSocket();
    removeToken();
    setTokenState(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      setStoredUser(updated);
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.users.getMe();
      if (res?.data) {
        setUser(res.data);
        setStoredUser(res.data);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
