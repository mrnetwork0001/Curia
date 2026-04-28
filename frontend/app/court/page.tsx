"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AgentCard from "@/components/AgentCard";
import MessageFeed from "@/components/MessageFeed";
import { Scale, Zap, Globe } from "lucide-react";
import PhaseIndicator from "@/components/PhaseIndicator";
import VerdictDisplay from "@/components/VerdictDisplay";
import { useWebSocket } from "@/lib/websocket";
import { getAgents, getTrialStatus, getTopology, getTranscript } from "@/lib/api";
import type { AgentInfo, CuriaMessage } from "@/lib/types";
import styles from "./page.module.css";

export default function CourtPage() {
  const { connected, messages: wsMessages, currentPhase: wsPhase, trialActive: wsTrialActive } = useWebSocket();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [juryVotes, setJuryVotes] = useState<Record<string, string>>({});
  const [simulationMode, setSimulationMode] = useState<boolean | null>(null);
  const [catchupMessages, setCatchupMessages] = useState<CuriaMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>("filing");
  const [trialActive, setTrialActive] = useState(false);

  // Merge WS messages with any REST catch-up messages (deduplicate by sequence)
  const messages = [
    ...catchupMessages,
    ...wsMessages.filter(
      (m) => !catchupMessages.some((c) => c.sequence === m.sequence && c.from_role === m.from_role)
    ),
  ];

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getAgents();
        setAgents(data.agents as unknown as AgentInfo[]);
      } catch (err) {
        // Fallback agent data for when backend isn't running
        setAgents([
          { role: "judge", label: "Chief Justice", color: "#D4A84B", icon: "⚖️", peer_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", axl_port: 9002, message_count: 0, status: "idle" },
          { role: "prosecutor", label: "Lead Prosecutor", color: "#E74C3C", icon: "🔴", peer_id: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3", axl_port: 9012, message_count: 0, status: "idle" },
          { role: "defender", label: "Defense Counsel", color: "#4A90D9", icon: "🛡️", peer_id: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", axl_port: 9022, message_count: 0, status: "idle" },
          { role: "juror1", label: "Juror #1", color: "#2ECC71", icon: "👤", peer_id: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5", axl_port: 9032, message_count: 0, status: "idle" },
          { role: "juror2", label: "Juror #2", color: "#27AE60", icon: "👤", peer_id: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6", axl_port: 9042, message_count: 0, status: "idle" },
        ]);
      }
    };
    fetchAgents();
    const agentInterval = setInterval(fetchAgents, 5000);

    // Fetch topology to determine AXL vs Simulation mode
    getTopology()
      .then((topo) => setSimulationMode(topo.simulation_mode))
      .catch(() => setSimulationMode(true));

    // Poll trial status + fetch transcript catch-up every 3s
    // This ensures we don't miss messages fired before the WS connected
    const syncTrialState = async () => {
      try {
        const status = await getTrialStatus();
        setTrialActive(status.active);
        if (status.phase) setCurrentPhase(status.phase);
        if (status.verdict) setVerdict(status.verdict);

        if (status.active && status.case_id) {
          const t = await getTranscript(status.case_id);
          if (t.transcript && t.transcript.length > 0) {
            setCatchupMessages(t.transcript as unknown as CuriaMessage[]);
          }
          if (t.verdict) setVerdict(t.verdict);
        }
      } catch { /* backend may not have active trial */ }
    };

    syncTrialState();
    const syncInterval = setInterval(syncTrialState, 3000);

    return () => {
      clearInterval(agentInterval);
      clearInterval(syncInterval);
    };
  }, []);

  // Watch for verdict
  useEffect(() => {
    const verdictMsg = messages.find(
      (m: CuriaMessage) => m.message_type === "final_verdict"
    );
    if (verdictMsg) {
      setVerdict(verdictMsg.content);
      setJuryVotes((verdictMsg.metadata?.jury_votes as Record<string, string>) || {});
    }
  }, [messages]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Scale size={28} color="#D4A84B" /> Live Courtroom
          </h1>
          <div className={styles.headerRight}>
            {simulationMode !== null && (
              <div
                className={styles.axlModeBadge}
                style={{
                  background: simulationMode
                    ? "rgba(212,168,75,0.12)"
                    : "rgba(46,204,113,0.12)",
                  borderColor: simulationMode ? "rgba(212,168,75,0.3)" : "rgba(46,204,113,0.4)",
                  color: simulationMode ? "#D4A84B" : "#2ECC71",
                }}
                title={simulationMode
                  ? "Running in simulation mode - no real AXL nodes. Set SIMULATION_MODE=false and start AXL nodes to use real P2P network."
                  : "Real AXL nodes active - all agent communication is encrypted P2P over the Yggdrasil mesh network."
                }
              >
                {simulationMode ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Zap size={14} /> SIMULATION MODE</span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Globe size={14} /> REAL AXL NETWORK</span>
                )}
              </div>
            )}
            <div className={styles.status}>
              <span className={`${styles.statusDot} ${connected ? styles.connected : ""}`} />
              <span>{connected ? "Connected" : "Connecting..."}</span>
              {trialActive && <span className={styles.liveTag}>● LIVE</span>}
            </div>
          </div>
        </div>

        <div className={styles.courtLayout}>
          {/* Left Panel: Agents */}
          <aside className={styles.agentPanel}>
            <h2 className={styles.panelTitle}>Court Agents</h2>
            <div className={styles.agentList}>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.role}
                  agent={agent}
                  isActive={trialActive && agent.status === "listening"}
                />
              ))}
            </div>
          </aside>

          {/* Center: Message Feed */}
          <section className={styles.messagePanel}>
            <div className={styles.messagePanelHeader}>
              <h2 className={styles.panelTitle}>P2P Message Stream</h2>
              <span className={styles.messageCount}>
                {messages.length} messages
              </span>
            </div>
            <MessageFeed messages={messages} />
            {verdict && (
              <VerdictDisplay verdict={verdict} juryVotes={juryVotes} />
            )}
          </section>

          {/* Right Panel: Phases */}
          <aside className={styles.phasePanel}>
            <PhaseIndicator currentPhase={currentPhase} />
          </aside>
        </div>
      </main>
    </>
  );
}
