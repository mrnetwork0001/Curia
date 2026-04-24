"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import NetworkMesh from "@/components/NetworkMesh";
import { getTopology, getAgents } from "@/lib/api";
import type { AgentInfo } from "@/lib/types";
import styles from "./page.module.css";

interface NodeData {
  peer_id: string;
  role: string;
  axl_port: number;
  message_count: number;
  status: string;
  peers: string[];
}

export default function NetworkPage() {
  const [nodes, setNodes] = useState<Record<string, NodeData>>({});
  const [simulationMode, setSimulationMode] = useState(true);
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topoData, agentData] = await Promise.all([
          getTopology(),
          getAgents(),
        ]);
        setNodes(topoData.nodes as unknown as Record<string, NodeData>);
        setSimulationMode(topoData.simulation_mode);
        setAgents(agentData.agents as unknown as AgentInfo[]);
      } catch {
        // Fallback
        setNodes({
          judge: { peer_id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2", role: "judge", axl_port: 9002, message_count: 0, status: "idle", peers: ["prosecutor", "defender", "juror1", "juror2"] },
          prosecutor: { peer_id: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3", role: "prosecutor", axl_port: 9012, message_count: 0, status: "idle", peers: ["judge", "defender", "juror1", "juror2"] },
          defender: { peer_id: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", role: "defender", axl_port: 9022, message_count: 0, status: "idle", peers: ["judge", "prosecutor", "juror1", "juror2"] },
          juror1: { peer_id: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5", role: "juror1", axl_port: 9032, message_count: 0, status: "idle", peers: ["judge", "prosecutor", "defender", "juror2"] },
          juror2: { peer_id: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6", role: "juror2", axl_port: 9042, message_count: 0, status: "idle", peers: ["judge", "prosecutor", "defender", "juror1"] },
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const roleColors: Record<string, string> = {
    judge: "#D4A84B",
    prosecutor: "#E74C3C",
    defender: "#4A90D9",
    juror1: "#2ECC71",
    juror2: "#27AE60",
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>AXL Mesh Topology</h1>
            <p className={styles.subtitle}>
              Real-time visualization of the 5-node AXL mesh network powering Curia
            </p>
          </div>
          <span className={`badge ${simulationMode ? "badge-gold" : "badge-active"}`}>
            {simulationMode ? "Simulation" : "Live AXL"}
          </span>
        </div>

        <NetworkMesh nodes={nodes} />

        <div className={styles.nodeGrid}>
          {Object.entries(nodes).map(([role, node]) => (
            <div
              key={role}
              className={styles.nodeCard}
              style={{ borderColor: (roleColors[role] || "#888") + "30" }}
            >
              <div className={styles.nodeHeader}>
                <span className={styles.nodeDot} style={{ background: roleColors[role] }} />
                <h3 className={styles.nodeRole} style={{ color: roleColors[role] }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </h3>
                <span className={`badge ${node.status === "listening" || node.status === "active" ? "badge-active" : "badge-gold"}`}>
                  {node.status}
                </span>
              </div>
              <div className={styles.nodeDetails}>
                <div className={styles.nodeDetail}>
                  <span className={styles.detailLabel}>Port</span>
                  <span className={styles.detailValue}>{node.axl_port}</span>
                </div>
                <div className={styles.nodeDetail}>
                  <span className={styles.detailLabel}>Messages</span>
                  <span className={styles.detailValue}>{node.message_count}</span>
                </div>
                <div className={styles.nodeDetail}>
                  <span className={styles.detailLabel}>Peers</span>
                  <span className={styles.detailValue}>{node.peers?.length || 0}</span>
                </div>
              </div>
              <div className={styles.peerId}>
                <span className={styles.peerLabel}>Peer ID</span>
                <code className={styles.peerCode}>{node.peer_id}</code>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
