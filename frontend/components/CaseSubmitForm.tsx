"use client";

import { useState } from "react";
import { Gavel } from "lucide-react";
import styles from "./CaseSubmitForm.module.css";

interface Props {
  onSubmit: (data: {
    title: string;
    category: string;
    description: string;
    evidence: string[];
    plaintiff: string;
    defendant: string;
  }) => void;
  loading?: boolean;
}

export default function CaseSubmitForm({ onSubmit, loading }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("custom");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [plaintiff, setPlaintiff] = useState("");
  const [defendant, setDefendant] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      category,
      description,
      evidence: evidence.split("\n").filter((e) => e.trim()),
      plaintiff: plaintiff || "Plaintiff",
      defendant: defendant || "Defendant",
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} id="case-submit-form">
      <h3 className={styles.heading}>Submit New Dispute</h3>

      <div className={styles.field}>
        <label htmlFor="case-title">Dispute Title</label>
        <input
          id="case-title"
          className="input-field"
          type="text"
          placeholder="e.g. DAO Treasury Allocation Dispute"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="case-category">Category</label>
        <select
          id="case-category"
          className="input-field"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="dao_governance">DAO Governance</option>
          <option value="code_ownership">Code Ownership</option>
          <option value="content_moderation">Content Moderation</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="case-plaintiff">Plaintiff</label>
          <input
            id="case-plaintiff"
            className="input-field"
            type="text"
            placeholder="Who is filing the dispute?"
            value={plaintiff}
            onChange={(e) => setPlaintiff(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="case-defendant">Defendant</label>
          <input
            id="case-defendant"
            className="input-field"
            type="text"
            placeholder="Who is being accused?"
            value={defendant}
            onChange={(e) => setDefendant(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="case-description">Description</label>
        <textarea
          id="case-description"
          className="input-field"
          placeholder="Describe the dispute in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="case-evidence">Evidence (one per line)</label>
        <textarea
          id="case-evidence"
          className="input-field"
          placeholder="Enter each piece of evidence on a new line..."
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading || !title || !description} id="submit-case-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        {loading ? "Starting Trial..." : <><Gavel size={18} /> Submit to Court</>}
      </button>
    </form>
  );
}
