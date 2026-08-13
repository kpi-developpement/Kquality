"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthResponseDTO } from '@/types/api';

interface AuthContextType {
  user: AuthResponseDTO | null;
  loginUser: (data: AuthResponseDTO) => void;
  logoutUser: () => void;
  completePasswordChange: () => void; // 🛡️ JDIDA
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('kyntus_user');
    const storedToken = localStorage.getItem('kyntus_token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // 🛡️ L'FIX HWA HNA: Le Gardien (Bouncer)
      if (parsedUser.mustChangePassword && pathname !== '/force-password-change') {
        router.push('/force-password-change');
      } else if (!parsedUser.mustChangePassword && pathname === '/force-password-change') {
        redirectBasedOnRole(parsedUser.role);
      }
    } else if (pathname !== '/login') {
      router.push('/login');
    }
    setLoading(false);
  }, [pathname, router]);

  const redirectBasedOnRole = (role: string) => {
    if (role === 'ADMIN') router.push('/admin/vue-globale');
    else if (role === 'PILOTE') router.push('/admin');
    else router.push('/dashboard');
  };

  const loginUser = (data: AuthResponseDTO) => {
    localStorage.setItem('kyntus_token', data.token);
    localStorage.setItem('kyntus_user', JSON.stringify(data));
    setUser(data);

    if (data.mustChangePassword) {
      router.push('/force-password-change');
    } else {
      redirectBasedOnRole(data.role);
    }
  };

  // 🛡️ JDIDA: Mli y-beddel l'mot de passe b naja7
  const completePasswordChange = () => {
    if (user) {
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('kyntus_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      redirectBasedOnRole(updatedUser.role);
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
    <AuthContext.Provider value={{ user, loginUser, logoutUser, completePasswordChange, isAuthenticated: !!user }}>
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