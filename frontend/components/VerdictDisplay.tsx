"use client";

import styles from "./VerdictDisplay.module.css";

interface Props {
  verdict: string | null;
  juryVotes?: Record<string, string>;
}

export default function VerdictDisplay({ verdict, juryVotes }: Props) {
  if (!verdict) return null;

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
