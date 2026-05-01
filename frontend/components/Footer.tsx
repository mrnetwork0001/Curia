import { Scale } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerLogo} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Scale size={18} /> Curia Protocol
        </span>
        <span className={styles.footerText}>Built by <a href="https://x.com/encrypt_wizard" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>MrNetwork</a></span>
        <span className={styles.footerText}>Decentralized AI Arbitration</span>
      </div>
    </footer>
  );
}
