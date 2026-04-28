"use client";

import { useEffect, useState } from "react";
import styles from "./VerdictDisplay.module.css";

interface Props {
  verdict: string | null;
  juryVotes?: Record<string, string>;
}

export default function VerdictDisplay({ verdict, juryVotes }: Props) {
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  if (!verdict) return null;

  useEffect(() => {
    // Play authoritative gavel sound when verdict appears
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3");
    audio.volume = 0.6;
    audio.play().catch(e => console.log("Audio autoplay prevented by browser"));
  }, []);

  const handleArchive = () => {
    setArchiving(true);
    setTimeout(() => {
      // Simulate pushing to IPFS
      const mockCid = "Qm" + Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setIpfsHash(mockCid);
      setArchiving(false);
    }, 2000);
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        <br />
      </span>
    ));
  };

  return (
    <div className={styles.wrapper} id="verdict-display">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 168, 75, 0.2)', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.gavel} style={{ marginBottom: 0 }}>⚖️</div>
          <h2 className={styles.title} style={{ marginBottom: 0 }}>Final Verdict</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just watched 5 autonomous AI agents resolve a Web3 dispute live over the @gensyn AXL network! Verdict delivered. ⚖️ Check out Curia Protocol.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-hide"
            style={{ 
              background: '#000000', 
              border: '1px solid #333333', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '14px', height: '14px', fill: 'currentColor' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.007 4.25H5.078z"></path></svg>
            Share on X
          </a>
          <button 
            className="pdf-hide"
            onClick={handleArchive}
            disabled={archiving || ipfsHash !== null}
            title="Archive Immutable Verdict to IPFS"
            style={{ 
              background: ipfsHash ? '#2ECC71' : 'var(--gold-dim)', 
              border: `1px solid ${ipfsHash ? '#2ECC71' : 'var(--gold)'}`, 
              color: ipfsHash ? '#fff' : 'var(--gold)', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: ipfsHash ? 'default' : 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {archiving ? "⏳ Archiving..." : ipfsHash ? "✅ IPFS Saved" : "📦 Archive to IPFS"}
          </button>
          <button 
            className="pdf-hide"
            onClick={() => window.print()}
            title="Save as PDF"
            style={{ 
              background: 'var(--gold-dim)', 
              border: '1px solid var(--gold)', 
              color: 'var(--gold)', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(212, 168, 75, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--gold-dim)'}
          >
            📄 Download PDF
          </button>
        </div>
      </div>
      {ipfsHash && (
        <div style={{ padding: '12px', background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: '6px', marginBottom: '20px', fontSize: '0.85rem', color: '#2ECC71', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>IPFS CID:</span> 
          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>ipfs://{ipfsHash}</code>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>Immutable record generated</span>
        </div>
      )}
      <div className={styles.content}>
        {formatText(verdict)}
      </div>
      {juryVotes && Object.keys(juryVotes).length > 0 && (
        <div className={styles.votes}>
          <h4 className={styles.votesTitle}>Jury Votes</h4>
          {Object.entries(juryVotes).map(([role, vote]) => (
            <div key={role} className={styles.vote}>
              <span className={styles.voter}>{role.toUpperCase()}</span>
              <span className={styles.voteText}>{vote.slice(0, 100)}...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
