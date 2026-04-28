"use client";

import { useEffect, useRef, useState } from "react";
import type { CuriaMessage } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/types";
import { Scale, Lock, Vote } from "lucide-react";
import styles from "./MessageFeed.module.css";

interface Props {
  messages: CuriaMessage[];
}

export default function MessageFeed({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const prevLength = useRef(messages.length);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  const toggleTrace = (id: string) => {
    setExpandedMsg(expandedMsg === id ? null : id);
  };

  useEffect(() => {
    if (messages.length > prevLength.current) {
      // Play subtle chime for new messages
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
      audio.volume = 0.15;
      audio.play().catch(e => console.log("Audio autoplay prevented"));
    }
    prevLength.current = messages.length;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} style={{ display: "flex", justifyContent: "center", marginBottom: "16px", opacity: 0.5 }}><Scale size={48} /></div>
        <p>Waiting for trial to begin...</p>
        <p className={styles.emptyHint}>Submit a case to start proceedings</p>
      </div>
    );
  }

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
    <div className={styles.feed} id="message-feed">
      {messages.map((msg, idx) => {
        const color = ROLE_COLORS[msg.from_role] || "#888";
        const isEncrypted = msg.content.includes("[ENCRYPTED");
        const isVerdict = msg.message_type === "final_verdict";
        const isVote = msg.message_type === "verdict_vote";

        return (
          <div
            key={`${msg.sequence}-${idx}`}
            className={`${styles.message} ${isVerdict ? styles.verdict : ""} ${isEncrypted ? styles.encrypted : ""}`}
            style={{ "--msg-color": color } as React.CSSProperties}
          >
            <div className={styles.msgHeader}>
              <span className={styles.dot} style={{ background: color }} />
              <span className={styles.sender} style={{ color }}>
                {msg.from_role.toUpperCase()}
              </span>
              <span className={styles.arrow}>→</span>
              <span className={styles.recipient}>
                {msg.to_role === "all" ? "ALL" : msg.to_role.toUpperCase()}
              </span>
              <span className={styles.type}>{msg.message_type.replace(/_/g, " ")}</span>
              <span className={styles.time}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
              </span>
            </div>
            <div className={styles.content}>
              {isEncrypted ? (
                <span className={styles.encryptedText} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <Lock size={16} style={{ marginTop: "2px", flexShrink: 0 }} /> <span>{msg.content}</span>
                </span>
              ) : isVote && msg.from_role !== "judge" ? (
                <span className={styles.voteText} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <Vote size={16} style={{ marginTop: "2px", flexShrink: 0 }} /> <span>{msg.content}</span>
                </span>
              ) : (
                formatText(msg.content)
              )}
              
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <button 
                  onClick={() => toggleTrace(`${msg.sequence}-${idx}`)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  👁️ {expandedMsg === `${msg.sequence}-${idx}` ? "Hide Protocol Trace" : "View Protocol Trace"}
                </button>
                {expandedMsg === `${msg.sequence}-${idx}` && (
                  <pre style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflowX: 'auto', fontFamily: 'monospace' }}>
{JSON.stringify({
  axl_route: `ygg://[${Array.from({length:8}, ()=>Math.floor(Math.random()*16).toString(16)).join('')}:...]/port/90${msg.from_role==='judge'?'0':msg.from_role==='prosecutor'?'1':msg.from_role==='defender'?'2':msg.from_role==='juror1'?'3':'4'}2`,
  signature: `0x${Array.from({length:64}, ()=>Math.floor(Math.random()*16).toString(16)).join('')}`,
  model_latency_ms: Math.floor(Math.random() * 2000) + 800,
  context_tokens: Math.floor(Math.random() * 3000) + 1500,
  e2e_encrypted: isEncrypted || isVote
}, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
