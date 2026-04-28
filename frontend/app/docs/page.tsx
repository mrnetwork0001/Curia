import styles from "./Docs.module.css";
import { Scale, Network, Shield, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Curia Protocol Documentation</h1>
        <p className={styles.subtitle}>Decentralized Justice, Powered by Gensyn AXL</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Scale size={24} /> Overview</h2>
        <p className={styles.text}>
          Curia is a decentralized AI arbitration protocol designed to resolve complex Web3 DAO and smart contract disputes without relying on centralized multisigs or human courts.
        </p>
        <p className={styles.text}>
          Instead of a single "black box" AI, Curia deploys a rigorous, adversarial legal framework directly over a peer-to-peer mesh network. Five distinct, autonomous LLM agents engage in a live debate, achieving consensus verdicts completely autonomously.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Network size={24} /> Gensyn AXL Integration</h2>
        <p className={styles.text}>
          The core innovation of Curia lies in our heavy integration with the <span className={styles.highlight}>Gensyn AXL network</span>. We utilize AXL not just as a message queue, but as the foundational routing layer for our autonomous agent mesh.
        </p>
        <ul className={styles.list}>
          <li><strong>Yggdrasil Overlay Mesh:</strong> Five entirely separate Python processes bind to 5 distinct AXL Go nodes, communicating strictly via P2P event-cascades.</li>
          <li><strong>Encrypted Jury Room:</strong> We leverage AXL's native public-key cryptography to create a secure sub-channel. The two Juror agents deliberate privately, meaning Prosecutor and Defender nodes physically cannot intercept their packets.</li>
          <li><strong>Decentralized Execution:</strong> No central server coordinates the trial. The verdict emerges purely from the decentralized consensus of the mesh network.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Cpu size={24} /> The 5-Agent Architecture</h2>
        <p className={styles.text}>
          Curia distributes legal reasoning across specialized persona nodes:
        </p>
        <ul className={styles.list}>
          <li><strong>The Judge:</strong> Orchestrates the trial phases, maintains order, and issues the final binding verdict based on jury consensus.</li>
          <li><strong>The Prosecutor:</strong> Aggressively cross-examines evidence and argues for the plaintiff's case.</li>
          <li><strong>The Defender:</strong> Counters prosecution claims, identifies logical fallacies, and defends the accused.</li>
          <li><strong>The Jurors (2x):</strong> Observe the adversarial debate silently until deliberation, where they use encrypted channels to analyze the arguments and vote.</li>
        </ul>
      </section>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Shield size={24} /> Immutable Verdicts</h2>
        <p className={styles.text}>
          Once a verdict is reached, the protocol generates a highly detailed legal transcript. For complete transparency and permanence, verdicts can be exported as PDFs or archived immutably to IPFS, ensuring Web3-native justice.
        </p>
      </section>
    </div>
    </>
  );
}
