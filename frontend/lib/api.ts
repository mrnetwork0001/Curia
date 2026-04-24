/* ---- REST API client for the Curia backend ---- */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getCases() {
  return fetchAPI<{
    sample_cases: Record<string, unknown>[];
    active_cases: Record<string, unknown>[];
  }>("/api/cases");
}

export async function getCase(caseId: string) {
  return fetchAPI<Record<string, unknown>>(`/api/cases/${caseId}`);
}

export async function getTranscript(caseId: string) {
  return fetchAPI<{
    case_id: string;
    phase: string;
    transcript: Record<string, unknown>[];
    verdict: string | null;
  }>(`/api/cases/${caseId}/transcript`);
}

export async function submitCase(data: {
  title: string;
  category: string;
  description: string;
  evidence: string[];
  plaintiff: string;
  defendant: string;
}) {
  return fetchAPI<{ status: string; case_id: string; title: string }>("/api/cases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function startSampleCase(caseId: string) {
  return fetchAPI<{ status: string; case_id: string; title: string }>(
    `/api/cases/${caseId}/start`,
    { method: "POST" }
  );
}

export async function getTopology() {
  return fetchAPI<{
    nodes: Record<string, Record<string, unknown>>;
    simulation_mode: boolean;
  }>("/api/topology");
}

export async function getAgents() {
  return fetchAPI<{ agents: Record<string, unknown>[] }>("/api/agents");
}

export async function getTrialStatus() {
  return fetchAPI<{
    active: boolean;
    case_id?: string;
    title?: string;
    phase?: string;
    status?: string;
    message_count?: number;
    verdict?: string;
  }>("/api/trial/status");
}

export { API_BASE };
