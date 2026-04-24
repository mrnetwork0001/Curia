/* ---- TypeScript types matching the Python Pydantic models ---- */

export interface CuriaMessage {
  protocol: string;
  version: string;
  case_id: string;
  phase: string;
  from_role: string;
  to_role: string;
  message_type: string;
  content: string;
  timestamp: string;
  sequence: number;
  metadata?: Record<string, unknown>;
}

export interface AgentInfo {
  role: string;
  label: string;
  color: string;
  icon: string;
  peer_id: string;
  axl_port: number;
  message_count: number;
  status: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  evidence: string[];
  plaintiff: string;
  defendant: string;
  status: string;
  current_phase: string;
  transcript: CuriaMessage[];
  verdict?: string;
  jury_votes?: Record<string, string>;
  created_at: string;
  completed_at?: string;
}

export interface SampleCase {
  id: string;
  title: string;
  category: string;
  description: string;
  evidence: string[];
  plaintiff?: string;
  defendant?: string;
}

export interface TopologyNode {
  peer_id: string;
  role: string;
  axl_port: number;
  peers: string[];
  message_count: number;
  status: string;
}

export interface TrialStatus {
  active: boolean;
  case_id?: string;
  title?: string;
  phase?: string;
  status?: string;
  message_count?: number;
  verdict?: string;
}

export interface WSEvent {
  type: "message" | "phase_change" | "trial_start" | "trial_end";
  data: Record<string, unknown>;
}

// Phase display info
export const PHASE_INFO: Record<string, { label: string; icon: string; description: string }> = {
  filing: { label: "Filing", icon: "📋", description: "Dispute submitted for review" },
  opening: { label: "Opening", icon: "📜", description: "Case briefing distributed to all agents" },
  prosecution: { label: "Prosecution", icon: "🔴", description: "Prosecutor presents opening argument" },
  defense: { label: "Defense", icon: "🛡️", description: "Defense presents counter-argument" },
  cross_examination: { label: "Cross-Examination", icon: "⚔️", description: "Adversarial questioning via P2P" },
  rebuttal: { label: "Rebuttal", icon: "💬", description: "Both sides deliver closing arguments" },
  deliberation: { label: "Deliberation", icon: "🔒", description: "Jurors deliberate on encrypted private channel" },
  verdict: { label: "Verdict", icon: "⚖️", description: "Final verdict announced by the Judge" },
  completed: { label: "Completed", icon: "✅", description: "Trial concluded" },
};

// Role color map
export const ROLE_COLORS: Record<string, string> = {
  judge: "#D4A84B",
  prosecutor: "#E74C3C",
  defender: "#4A90D9",
  juror1: "#2ECC71",
  juror2: "#27AE60",
};
