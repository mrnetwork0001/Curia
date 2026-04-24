import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero} id="hero">
          <div className={styles.heroBg}>
            <svg className={styles.meshSvg} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
              {/* Neural mesh background */}
              <defs>
                <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(212,168,75,0.15)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="400" cy="200" r="180" fill="url(#glow1)" />
              {/* Nodes */}
              {[
                [400, 80], [280, 160], [520, 160], [320, 280], [480, 280],
                [200, 100], [600, 100], [180, 250], [620, 250], [400, 340],
              ].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="3" fill="#D4A84B" opacity={0.4 + (i % 3) * 0.2}>
                    <animate attributeName="r" values="3;5;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
              {/* Connections */}
              {[
                [400,80,280,160], [400,80,520,160], [280,160,320,280],
                [520,160,480,280], [320,280,480,280], [280,160,520,160],
                [200,100,280,160], [600,100,520,160], [180,250,320,280],
                [620,250,480,280], [400,340,320,280], [400,340,480,280],
              ].map(([x1,y1,x2,y2], i) => (
                <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(212,168,75,0.08)" strokeWidth="1" />
              ))}
              {/* Scales of Justice */}
              <g transform="translate(370,150)">
                <line x1="30" y1="0" x2="30" y2="60" stroke="#D4A84B" strokeWidth="1.5" opacity="0.6" />
                <line x1="0" y1="0" x2="60" y2="0" stroke="#D4A84B" strokeWidth="1.5" opacity="0.6" />
                <path d="M0,0 L8,25 L-8,25 Z" fill="none" stroke="#D4A84B" strokeWidth="1" opacity="0.5">
                  <animateTransform attributeName="transform" type="rotate" values="-3,0,0;3,0,0;-3,0,0" dur="4s" repeatCount="indefinite" />
                </path>
                <path d="M60,0 L68,25 L52,25 Z" fill="none" stroke="#D4A84B" strokeWidth="1" opacity="0.5">
                  <animateTransform attributeName="transform" type="rotate" values="3,60,0;-3,60,0;3,60,0" dur="4s" repeatCount="indefinite" />
                </path>
                <circle cx="30" cy="60" r="8" fill="none" stroke="#D4A84B" strokeWidth="1" opacity="0.4" />
              </g>
            </svg>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Built on AXL P2P Mesh
            </div>
            <h1 className={styles.title}>
              Decentralized Justice,<br />
              <span className={styles.titleGold}>No Central Authority</span>
            </h1>
            <p className={styles.subtitle}>
              AI agents with distinct legal roles debate disputes peer-to-peer over AXL,
              reaching consensus verdicts through adversarial deliberation — zero central coordinator.
            </p>
            <div className={styles.ctas}>
              <Link href="/cases" className="btn-primary" id="cta-submit">
                ⚖️ Submit a Dispute
              </Link>
              <Link href="/court" className="btn-secondary" id="cta-watch">
                Watch a Live Trial →
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.features} id="features">
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚔️</div>
              <h3 className={styles.featureName}>Adversarial Debate</h3>
              <p className={styles.featureDesc}>
                Prosecution and defense AI agents argue both sides of every case,
                cross-examining each other to expose weaknesses through rigorous P2P exchanges.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureName}>Encrypted P2P</h3>
              <p className={styles.featureDesc}>
                Jury deliberation happens over encrypted private AXL channels.
                Other agents cannot see juror analysis — demonstrating true E2E encryption.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🗳️</div>
              <h3 className={styles.featureName}>Consensus Verdicts</h3>
              <p className={styles.featureDesc}>
                Verdicts emerge from P2P consensus. Jurors independently evaluate evidence,
                deliberate privately, then vote — Judge synthesizes the final ruling.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.agentGrid}>
            {[
              { icon: "⚖️", role: "Judge", color: "#D4A84B", desc: "Orchestrates proceedings, rules on objections, delivers final verdict" },
              { icon: "🔴", role: "Prosecutor", color: "#E74C3C", desc: "Builds the case for the plaintiff, cross-examines the defense" },
              { icon: "🛡️", role: "Defender", color: "#4A90D9", desc: "Counters prosecution arguments, identifies weaknesses" },
              { icon: "👤", role: "Juror 1", color: "#2ECC71", desc: "Evaluates evidence independently, deliberates via encrypted P2P" },
              { icon: "👤", role: "Juror 2", color: "#27AE60", desc: "Evaluates evidence independently, deliberates via encrypted P2P" },
            ].map((agent) => (
              <div key={agent.role} className={styles.agentItem} style={{ borderColor: agent.color + "30" }}>
                <span className={styles.agentIcon}>{agent.icon}</span>
                <h4 className={styles.agentRole} style={{ color: agent.color }}>{agent.role}</h4>
                <p className={styles.agentDesc}>{agent.desc}</p>
                <span className={styles.agentTag}>Separate AXL Node</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span className={styles.footerLogo}>⚖️ Curia Protocol</span>
            <span className={styles.footerText}>Built for the Gensyn AXL Hackathon</span>
            <span className={styles.footerText}>Decentralized AI Arbitration</span>
          </div>
        </footer>
      </main>
    </>
  );
}
