"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthResponseDTO } from '@/types/api';

interface AuthContextType {
  user: AuthResponseDTO | null;
  loginUser: (data: AuthResponseDTO) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Mli kat-t7el l'application, kan-checou wach kayn Token f LocalStorage
    const storedUser = localStorage.getItem('kyntus_user');
    const storedToken = localStorage.getItem('kyntus_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else if (pathname !== '/login') {
      router.push('/login');
    }
    setLoading(false);
  }, [pathname, router]);

  const loginUser = (data: AuthResponseDTO) => {
    localStorage.setItem('kyntus_token', data.token);
    localStorage.setItem('kyntus_user', JSON.stringify(data));
    setUser(data);

    // Redirection 3la 7ssab l'Role
    if (data.role === 'ADMIN') {
      router.push('/admin/vue-globale');
    } else if (data.role === 'PILOTE') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('kyntus_token');
    localStorage.removeItem('kyntus_user');
    setUser(null);
    router.push('/login');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement K-Qualité...</div>;

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, isAuthenticated: !!user }}>
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