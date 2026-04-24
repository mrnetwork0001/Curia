"use client";

import { useEffect, useRef } from "react";
import type { CuriaMessage } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/types";
import styles from "./MessageFeed.module.css";

interface Props {
  messages: CuriaMessage[];
}

export default function MessageFeed({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>⚖️</div>
        <p>Waiting for trial to begin...</p>
        <p className={styles.emptyHint}>Submit a case to start proceedings</p>
      </div>
    );
  }

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
                <span className={styles.encryptedText}>
                  🔒 {msg.content}
                </span>
              ) : isVote && msg.from_role !== "judge" ? (
                <span className={styles.voteText}>
                  🗳️ {msg.content}
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
