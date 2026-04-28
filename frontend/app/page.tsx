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
          {/* Left Column: Info */}
          <div className={styles.heroContent}>
            <div className={styles.badge} style={{ margin: "0 0 24px 0" }}>
              <span className={styles.badgeDot} />
              Built on AXL P2P Mesh
            </div>
            <h1 className={styles.title} style={{ textAlign: "left" }}>
              Decentralized Justice,<br />
              <span className={styles.titleGold}>No Central Authority</span>
            </h1>
            <p className={styles.subtitle} style={{ textAlign: "left", margin: "0 0 36px 0", maxWidth: "100%" }}>
              AI agents with distinct legal roles debate disputes peer-to-peer over AXL,
              reaching consensus verdicts through adversarial deliberation — zero central coordinator.
            </p>
            <div className={styles.ctas} style={{ justifyContent: "flex-start" }}>
              <Link href="/cases" className="btn-primary" id="cta-submit">
                ⚖️ Submit a Dispute
              </Link>
              <Link href="/court" className="btn-secondary" id="cta-watch">
                Watch a Live Trial →
              </Link>
            </div>
          </div>

          {/* Right Column: 5-Node AXL Mesh Animation */}
          <div className={styles.heroVisual}>
            <div className={styles.meshContainer}>
              <svg className={styles.meshSvg} viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glow-judge" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-prosecutor" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-defender" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-juror" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-packet" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Mesh Connections (Lines) */}
                <g strokeWidth="2" strokeOpacity="0.15">
                  <line x1="250" y1="250" x2="100" y2="120" stroke="#E74C3C" />
                  <line x1="250" y1="250" x2="100" y2="380" stroke="#4A90D9" />
                  <line x1="250" y1="250" x2="400" y2="120" stroke="#2ECC71" />
                  <line x1="250" y1="250" x2="400" y2="380" stroke="#27AE60" />
                  <line x1="100" y1="120" x2="100" y2="380" stroke="#E74C3C" strokeOpacity="0.1" /> /* Pro to Def */
                  <line x1="100" y1="380" x2="400" y2="380" stroke="rgba(255,255,255,0.1)" /> /* Def to Juror2 */
                  <line x1="400" y1="120" x2="400" y2="380" stroke="#2ECC71" strokeOpacity="0.2" strokeDasharray="4 4" /> /* Juror to Juror enc */
                </g>

                {/* Central Scale of Justice Behind Judge */}
                <g transform="translate(225,225) scale(0.8)">
                  <line x1="30" y1="0" x2="30" y2="60" stroke="#D4A84B" strokeWidth="2" opacity="0.3" />
                  <line x1="-15" y1="10" x2="75" y2="10" stroke="#D4A84B" strokeWidth="2" opacity="0.3" />
                  <path d="M-15,10 L-5,35 L-25,35 Z" fill="none" stroke="#D4A84B" strokeWidth="1" opacity="0.2">
                    <animateTransform attributeName="transform" type="rotate" values="-5,0,0;5,0,0;-5,0,0" dur="4s" repeatCount="indefinite" />
                  </path>
                  <path d="M75,10 L85,35 L65,35 Z" fill="none" stroke="#D4A84B" strokeWidth="1" opacity="0.2">
                    <animateTransform attributeName="transform" type="rotate" values="5,60,0;-5,60,0;5,60,0" dur="4s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Continous Data Packets (Flying between nodes) */}
                <circle r="4" fill="#E74C3C" filter="url(#glow-packet)">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M100,120 L100,380" />
                  <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle r="4" fill="#4A90D9" filter="url(#glow-packet)">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M100,380 L250,250" />
                  <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="3" fill="#2ECC71" filter="url(#glow-packet)">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M400,120 L400,380" />
                  <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle r="5" fill="#D4A84B" filter="url(#glow-packet)">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M250,250 L100,120" />
                  <animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle r="4" fill="#27AE60" filter="url(#glow-packet)">
                  <animateMotion dur="2.8s" repeatCount="indefinite" path="M400,380 L250,250" />
                  <animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite" />
                </circle>

                {/* The 5 Node Entities */}
                <g transform="translate(250, 250)">
                  <circle r="18" fill="rgba(212,168,75,0.15)" stroke="#D4A84B" strokeWidth="2" filter="url(#glow-judge)" />
                  <circle r="10" fill="#D4A84B" />
                  <text y="40" fill="#D4A84B" fontSize="13" fontWeight="700" textAnchor="middle" letterSpacing="1">JUDGE (9002)</text>
                </g>

                <g transform="translate(100, 120)">
                  <circle r="16" fill="rgba(231,76,60,0.15)" stroke="#E74C3C" strokeWidth="2" filter="url(#glow-prosecutor)" />
                  <circle r="8" fill="#E74C3C">
                    <animate attributeName="r" values="8;11;8" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <text y="-25" fill="#E74C3C" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="1">PROSECUTOR</text>
                </g>

                <g transform="translate(100, 380)">
                  <circle r="16" fill="rgba(74,144,217,0.15)" stroke="#4A90D9" strokeWidth="2" filter="url(#glow-defender)" />
                  <circle r="8" fill="#4A90D9">
                    <animate attributeName="r" values="8;11;8" dur="2.1s" repeatCount="indefinite" />
                  </circle>
                  <text y="35" fill="#4A90D9" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="1">DEFENDER</text>
                </g>

                <g transform="translate(400, 120)">
                  <circle r="16" fill="rgba(46,204,113,0.15)" stroke="#2ECC71" strokeWidth="2" filter="url(#glow-juror)" />
                  <circle r="8" fill="#2ECC71">
                    <animate attributeName="r" values="8;11;8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <text y="-25" fill="#2ECC71" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="1">JUROR 1</text>
                </g>

                <g transform="translate(400, 380)">
                  <circle r="16" fill="rgba(39,174,96,0.15)" stroke="#27AE60" strokeWidth="2" filter="url(#glow-juror)" />
                  <circle r="8" fill="#27AE60">
                    <animate attributeName="r" values="8;11;8" dur="2.3s" repeatCount="indefinite" />
                  </circle>
                  <text y="35" fill="#27AE60" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="1">JUROR 2</text>
                </g>
              </svg>
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
