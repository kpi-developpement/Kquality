"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logoutUser, isAuthenticated } = useAuth();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // 🚀 L'EFFET AURA INTERACTIVE (Mouse Tracking)
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const rect = sidebar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Kan-injektiw les coordonnées dyal la souris direct f l'CSS
        sidebar.style.setProperty('--mouse-x', `${x}px`);
        sidebar.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    sidebar.addEventListener('mousemove', handleMouseMove);
    return () => sidebar.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isAuthenticated || pathname === '/login') return null;

  // Icons SVG Premium (Dark Blue Base)
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>,
    erreurs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>,
    penalites: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    excel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    kpi: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    import: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
    logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  };

  const NavItem = ({ href, icon, text, isActive }: { href: string, icon: React.ReactNode, text: string, isActive: boolean }) => (
    <Link href={href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
      <div className={styles.iconBox}>{icon}</div>
      <span className={styles.navText}>{text}</span>
    </Link>
  );

  return (
    <aside 
      ref={sidebarRef}
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={styles.logoSection}>
        <div className={styles.logoBadge}>K</div>
        <div className={styles.logoTextWrapper}>
          <span className={styles.logoText}>K-Qualité</span>
          <span className={styles.logoSubtext}>Portail Sécurisé</span>
        </div>
      </div>

      <div className={styles.navLinks}>
        {/* Menu PARTENAIRE */}
        {!user?.mustChangePassword && user?.role === 'PARTENAIRE' && (
          <>
            <NavItem href="/dashboard" icon={icons.dashboard} text="Vue d'ensemble" isActive={pathname === '/dashboard'} />
            <NavItem href="/erreurs" icon={icons.erreurs} text="Registre Erreurs" isActive={pathname.startsWith('/erreurs')} />
            <NavItem href="/cq-penalites" icon={icons.penalites} text="CQ & Pénalités" isActive={pathname === '/cq-penalites'} />
            <NavItem href="/cq-details" icon={icons.excel} text="Détails CQ (Excel)" isActive={pathname === '/cq-details'} />
            <NavItem href="/cq-partenaire" icon={icons.kpi} text="Indicateurs CQ" isActive={pathname === '/cq-partenaire'} />
          </>
        )}

        {/* Menu PILOTE */}
        {!user?.mustChangePassword && user?.role === 'PILOTE' && (
          <NavItem href="/admin" icon={icons.penalites} text="Gestion Contestations" isActive={pathname === '/admin'} />
        )}

        {/* Menu ADMIN */}
        {!user?.mustChangePassword && user?.role === 'ADMIN' && (
          <>
            <NavItem href="/admin/vue-globale" icon={icons.kpi} text="Supervision Globale" isActive={pathname === '/admin/vue-globale'} />
            <NavItem href="/admin/cq-data" icon={icons.excel} text="Données CQ" isActive={pathname === '/admin/cq-data'} />
            <NavItem href="/admin/cq-partenaire" icon={icons.dashboard} text="Moteur d'Agrégation" isActive={pathname === '/admin/cq-partenaire'} />
            <NavItem href="/admin/erreurs" icon={icons.erreurs} text="Centre de Contrôle" isActive={pathname === '/admin/erreurs'} />
            <NavItem href="/admin" icon={icons.penalites} text="Centre d'Arbitrage" isActive={pathname === '/admin'} />
            <NavItem href="/admin/utilisateurs" icon={icons.users} text="IAM - Sécurité" isActive={pathname === '/admin/utilisateurs'} />
            <NavItem href="/admin/import" icon={icons.import} text="Data Dispatcher" isActive={pathname === '/admin/import'} />
          </>
        )}
      </div>

      <div className={styles.footerSection}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.partnerName}>{user?.email.split('@')[0]}</span>
            <span className={styles.roleBadge}>{user?.role.replace('_', ' ')}</span>
          </div>
        </div>
        
        <button className={styles.logoutBtn} onClick={logoutUser}>
          <div className={styles.iconBox}>{icons.logout}</div>
          <span className={styles.navText}>Déconnexion sécurisée</span>
        </button>
      </div>
    </aside>
  );
}