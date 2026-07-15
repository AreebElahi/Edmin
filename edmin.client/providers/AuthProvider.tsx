'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthUser } from '../types/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, mustChangePassword?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/login');
  };

  const login = (token: string, mustChangePassword?: boolean) => {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=604800; samesite=strict`;
    const decoded = jwtDecode<AuthUser>(token);
    setUser(decoded);
    
    if (mustChangePassword) {
      router.push('/change-password');
      return;
    }
    
    if (decoded.role === 'FACULTY') {
      router.push('/dashboard/faculty');
    } else if (decoded.role === 'STUDENT') {
      router.push('/dashboard/student');
    } else if (decoded.role === 'HR') {
      router.push('/dashboard/hr');
    } else {
      router.push('/dashboard/admin');
    }
  };

  useEffect(() => {
    // 1. Initial check on mount
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<AuthUser>(token);
        // Check expiry
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded);
        }
      } catch (err) {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
    setIsLoading(false);

    // 2. Listen for unauthorized events emitted by apiClient interceptor
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // 3. Listen for password change required events
    const handlePasswordChangeRequired = () => {
      router.push('/change-password');
    };
    window.addEventListener('auth:password_change_required', handlePasswordChangeRequired);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:password_change_required', handlePasswordChangeRequired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
