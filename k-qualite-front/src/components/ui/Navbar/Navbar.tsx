"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoBadge}>K</div>
        <div>
          <span className={styles.logoText}>K-Qualité</span>
          <span className={styles.logoSubtext}>Portail Partenaires</span>
        </div>
      </div>

      <div className={styles.navLinks}>
        <Link 
          href="/dashboard" 
          className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
        >
          Vue d'ensemble
        </Link>
        <Link 
          href="/erreurs" 
          className={`${styles.navItem} ${pathname.startsWith('/erreurs') ? styles.active : ''}`}
        >
          Erreurs
        </Link>
        <Link 
          href="/cq-penalites" 
          className={`${styles.navItem} ${pathname === '/cq-penalites' ? styles.active : ''}`}
        >
          CQ & Pénalités
        </Link>
      </div>

      <div className={styles.userProfile}>
        <span className={styles.partnerName}>ASTR</span>
        <span className={styles.roleBadge}>Partenaire</span>
      </div>
    </nav>
  );
}