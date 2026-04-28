"use client";

import type { AgentInfo } from "@/lib/types";
import { Gavel, Swords, Shield, User } from "lucide-react";
import styles from "./AgentCard.module.css";

interface Props {
  agent: AgentInfo;
  isActive?: boolean;
}

export default function AgentCard({ agent, isActive }: Props) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "judge": return <Gavel size={18} />;
      case "prosecutor": return <Swords size={18} />;
      case "defender": return <Shield size={18} />;
      case "juror1":
      case "juror2": return <User size={18} />;
      default: return <User size={18} />;
    }
  };

  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : ""}`}
      style={{ "--agent-color": agent.color } as React.CSSProperties}
      id={`agent-${agent.role}`}
    >
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span className={styles.icon}>{getRoleIcon(agent.role)}</span>
          <span className={styles.statusDot} data-status={agent.status} />
        </div>
        <div className={styles.info}>
          <h3 className={styles.label}>{agent.label}</h3>
          <span className={styles.role}>{agent.role.toUpperCase()}</span>
        </div>
      </div>
      <div className={styles.peerId}>
        <span className={styles.peerLabel}>AXL Peer ID</span>
        <code className={styles.peerCode}>
          {agent.peer_id ? `${agent.peer_id.slice(0, 8)}...${agent.peer_id.slice(-8)}` : "-"}
        </code>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{agent.message_count}</span>
          <span className={styles.statLabel}>Messages</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{agent.axl_port}</span>
          <span className={styles.statLabel}>Port</span>
        </div>
      </div>
    </div>
  );
}
