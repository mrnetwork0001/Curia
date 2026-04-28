"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CaseSubmitForm from "@/components/CaseSubmitForm";
import { getCases, submitCase, startSampleCase } from "@/lib/api";
import type { SampleCase, CaseRecord } from "@/lib/types";
import styles from "./page.module.css";

export default function CasesPage() {
  const [sampleCases, setSampleCases] = useState<SampleCase[]>([]);
  const [activeCases, setActiveCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await getCases();
      const raw = data.active_cases as unknown as CaseRecord[];
      // Deduplicate by ID: keep active > timeout > completed, then most recent
      const seen = new Map<string, CaseRecord>();
      const statusRank: Record<string, number> = { active: 0, completed: 1, timeout: 2 };
      for (const c of raw) {
        const existing = seen.get(c.id);
        if (!existing || (statusRank[c.status] ?? 9) < (statusRank[existing.status] ?? 9)) {
          seen.set(c.id, c);
        }
      }
      const deduped = Array.from(seen.values()).sort(
        (a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)
      );
      setSampleCases(data.sample_cases as unknown as SampleCase[]);
      setActiveCases(deduped);
    } catch (err) {
      // Fallback sample cases
      setSampleCases([
        { id: "case-2026-001", title: "MetaGov DAO Treasury Allocation", category: "dao_governance", description: "The MetaGov DAO community is split on whether to allocate 500,000 USDC...", evidence: [] },
        { id: "case-2026-002", title: "Fork Attribution Dispute", category: "code_ownership", description: "Developer A claims Developer B forked their open-source library...", evidence: [] },
        { id: "case-2026-003", title: "Community Post Removal Appeal", category: "content_moderation", description: "A community moderator removed a post criticizing tokenomics...", evidence: [] },
      ]);
    }
  };

  const handleSubmit = async (data: {
    title: string;
    category: string;
    description: string;
    evidence: string[];
    plaintiff: string;
    defendant: string;
  }) => {
    setLoading(true);
    try {
      const result = await submitCase(data);
      setNotification(`Trial started: ${result.title} (${result.case_id})`);
      fetchCases();
    } catch (err) {
      setNotification("Failed to start trial. Is the backend running?");
    }
    setLoading(false);
  };

  const handleStartSample = async (caseId: string) => {
    setLoading(true);
    try {
      const result = await startSampleCase(caseId);
      setNotification(`Trial started: ${result.title}`);
      fetchCases();
    } catch (err) {
      setNotification("Failed to start trial. Is the backend running?");
    }
    setLoading(false);
  };

  const categoryColors: Record<string, string> = {
    dao_governance: "#D4A84B",
    code_ownership: "#4A90D9",
    content_moderation: "#E74C3C",
    custom: "#9B97A0",
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Cases</h1>
        <p className={styles.subtitle}>
          Submit new disputes or run pre-loaded sample cases for demonstration.
        </p>

        {notification && (
          <div className={styles.notification}>
            {notification}
            <button onClick={() => setNotification(null)} className={styles.dismiss}>×</button>
          </div>
        )}

        <div className={styles.layout}>
          {/* Left: Case List */}
          <section className={styles.casesSection}>
            <h2 className={styles.sectionTitle}>Sample Cases</h2>
            <div className={styles.caseGrid}>
              {sampleCases.map((c) => (
                <div key={c.id} className={styles.caseCard}>
                  <div className={styles.caseHeader}>
                    <span className={styles.categoryBadge}
                      style={{ color: categoryColors[c.category] || "#888", borderColor: (categoryColors[c.category] || "#888") + "40" }}
                    >
                      {c.category.replace(/_/g, " ")}
                    </span>
                    <span className={styles.caseId}>{c.id}</span>
                  </div>
                  <h3 className={styles.caseName}>{c.title}</h3>
                  <p className={styles.caseDesc}>{c.description.slice(0, 150)}...</p>
                  <button
                    className="btn-primary"
                    onClick={() => handleStartSample(c.id)}
                    disabled={loading}
                    id={`start-${c.id}`}
                  >
                    ⚖️ Start Trial
                  </button>
                </div>
              ))}
            </div>

            {activeCases.length > 0 && (
              <>
                <h2 className={styles.sectionTitle} style={{ marginTop: "40px" }}>Active & Completed</h2>
                <div className={styles.caseGrid}>
                  {activeCases.map((c, i) => (
                    <div key={`${c.id}-${i}`} className={styles.caseCard}>
                      <div className={styles.caseHeader}>
                        <span className={`badge ${c.status === "active" ? "badge-active" : c.status === "completed" ? "badge-completed" : "badge-gold"}`}>
                          {c.status}
                        </span>
                        <span className={styles.caseId}>{c.id}</span>
                      </div>
                      <h3 className={styles.caseName}>{c.title}</h3>
                      <p className={styles.casePhase}>Phase: {c.current_phase}</p>
                      <Link href="/court" className="btn-secondary" style={{ marginTop: "8px" }}>
                        View in Courtroom →
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Right: Submit Form */}
          <aside className={styles.formSection}>
            <CaseSubmitForm onSubmit={handleSubmit} loading={loading} />
          </aside>
        </div>
      </main>
    </>
  );
}
