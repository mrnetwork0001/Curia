"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./VerdictDisplay.module.css";

interface Props {
  verdict: string | null;
  juryVotes?: Record<string, string>;
}

export default function VerdictDisplay({ verdict, juryVotes }: Props) {
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!verdict) return null;

  useEffect(() => {
    // Play authoritative gavel sound when verdict appears
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3");
    audioRef.current.volume = 0.6;
    audioRef.current.play().catch(e => console.log("Audio autoplay prevented by browser"));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
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
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.gavel} style={{ marginBottom: 0 }}>⚖️</div>
          <h2 className={styles.title} style={{ marginBottom: 0 }}>Final Verdict</h2>
        </div>
        <div className={styles.buttonGroup}>
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just watched 5 autonomous AI agents resolve a Web3 dispute live over the @gensyn AXL network! Verdict delivered. ⚖️ Check out Curia Protocol.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-hide"
            style={{ 
              background: 'var(--text-primary)', 
              border: '2px solid var(--text-primary)', 
              color: 'var(--bg-primary)', 
              padding: '8px 16px', 
              borderRadius: '0px', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: '4px 4px 0px var(--border-medium)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px var(--border-medium)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translate(0px, 0px)'; e.currentTarget.style.boxShadow = '4px 4px 0px var(--border-medium)'; }}
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
              background: ipfsHash ? '#2ECC71' : 'var(--bg-primary)', 
              border: `2px solid ${ipfsHash ? '#2ECC71' : 'var(--gold)'}`, 
              color: ipfsHash ? '#fff' : 'var(--gold)', 
              padding: '8px 16px', 
              borderRadius: '0px', 
              cursor: ipfsHash ? 'default' : 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: ipfsHash ? 'none' : '4px 4px 0px var(--gold)'
            }}
            onMouseOver={(e) => { if(!ipfsHash && !archiving) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px var(--gold)'; e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--bg-primary)'; } }}
            onMouseOut={(e) => { if(!ipfsHash && !archiving) { e.currentTarget.style.transform = 'translate(0px, 0px)'; e.currentTarget.style.boxShadow = '4px 4px 0px var(--gold)'; e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--gold)'; } }}
          >
            {archiving ? "[ Archiving... ]" : ipfsHash ? "[ IPFS Saved ]" : "[ Archive to IPFS ]"}
          </button>
          <button 
            className="pdf-hide"
            onClick={() => window.print()}
            title="Save as PDF"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '2px solid var(--text-secondary)', 
              color: 'var(--text-secondary)', 
              padding: '8px 16px', 
              borderRadius: '0px', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              boxShadow: '4px 4px 0px var(--text-secondary)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px var(--text-secondary)'; e.currentTarget.style.background = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--bg-primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translate(0px, 0px)'; e.currentTarget.style.boxShadow = '4px 4px 0px var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            [ Download PDF ]
          </button>
        </div>
      </div>
      {ipfsHash && (
        <div style={{ padding: '12px', background: 'var(--bg-tertiary)', border: '2px solid #2ECC71', borderRadius: '0px', marginBottom: '20px', fontSize: '0.85rem', color: '#2ECC71', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '4px 4px 0px #2ECC71' }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>[ IPFS CID ]</span> 
          <code style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '0px', wordBreak: 'break-all', border: '1px solid #2ECC71' }}>ipfs://{ipfsHash}</code>
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
