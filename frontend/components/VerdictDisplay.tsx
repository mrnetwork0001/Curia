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
      <div className={styles.gavel}>⚖️</div>
      <h2 className={styles.title}>Final Verdict</h2>
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
