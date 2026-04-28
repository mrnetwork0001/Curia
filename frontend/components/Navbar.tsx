"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/court", label: "Courtroom" },
    { href: "/cases", label: "Cases" },
    { href: "/network", label: "Network" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <nav className={styles.navbar} id="main-nav">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <svg
            className={styles.logo}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="14" stroke="#D4A84B" strokeWidth="1.5" />
            <path
              d="M9 20L16 8L23 20H9Z"
              stroke="#D4A84B"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <line x1="16" y1="20" x2="16" y2="25" stroke="#D4A84B" strokeWidth="1.5" />
            <line x1="12" y1="25" x2="20" y2="25" stroke="#D4A84B" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="14" r="2" fill="#D4A84B" />
          </svg>
          <span className={styles.brandName}>Curia</span>
          <span className={styles.tagline}>Protocol</span>
        </Link>

        <div className={styles.rightSection}>
          <div className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${pathname === link.href ? styles.active : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.meshStatus} title="5/5 Nodes Active">
            <div className={styles.pulseDot}></div>
            <span className={styles.statusText}>AXL Live</span>
          </div>

          <button 
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ""}`} />
          </button>
        </div>
      </div>
    </nav>
  );
}
