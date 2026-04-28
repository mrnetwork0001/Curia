import { Scale } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.footerLogo} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Scale size={18} /> Curia Protocol
        </span>
        <span className={styles.footerText}>Built for the Gensyn AXL Hackathon</span>
        <span className={styles.footerText}>Decentralized AI Arbitration</span>
      </div>
    </footer>
  );
}
