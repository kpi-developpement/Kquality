"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logoutUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || pathname === '/login') return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoBadge}>K</div>
        <div>
          <span className={styles.logoText}>K-Qualité</span>
          <span className={styles.logoSubtext}>Portail Sécurisé</span>
        </div>
      </div>

      <div className={styles.navLinks}>
        {/* 🛡️ L'FIX HWA HNA: N-khebbiyou l'menu ila kan f page dyal force-password */}
        {!user?.mustChangePassword && user?.role === 'PARTENAIRE' && (
          <>
            <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>Vue d'ensemble</Link>
            <Link href="/erreurs" className={`${styles.navItem} ${pathname.startsWith('/erreurs') ? styles.active : ''}`}>Erreurs</Link>
            <Link href="/cq-penalites" className={`${styles.navItem} ${pathname === '/cq-penalites' ? styles.active : ''}`}>CQ & Pénalités</Link>
          </>
        )}

        {!user?.mustChangePassword && user?.role === 'PILOTE' && (
          <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}>Gestion Contestations</Link>
        )}

        {!user?.mustChangePassword && user?.role === 'ADMIN' && (
          <>
            <Link href="/admin/vue-globale" className={`${styles.navItem} ${pathname === '/admin/vue-globale' ? styles.active : ''}`}>Vue Globale KPI</Link>
            <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}>Contestations</Link>
            <Link href="/admin/utilisateurs" className={`${styles.navItem} ${pathname === '/admin/utilisateurs' ? styles.active : ''}`}>Utilisateurs & Accès</Link>
          </>
        )}
      </div>

      <div className={styles.userProfile}>
        <span className={styles.partnerName}>{user?.email.split('@')[0].toUpperCase()}</span>
        <span className={styles.roleBadge}>{user?.role}</span>
        <button onClick={logoutUser} style={{ marginLeft: '15px', background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
      </div>
    </nav>
  );
}