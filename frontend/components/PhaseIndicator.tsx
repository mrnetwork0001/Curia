"use client";

import { PHASE_INFO } from "@/lib/types";
import styles from "./PhaseIndicator.module.css";

const PHASES = [
  "filing",
  "opening",
  "prosecution",
  "defense",
  "cross_examination",
  "rebuttal",
  "deliberation",
  "verdict",
];

interface Props {
  currentPhase: string;
}

export default function PhaseIndicator({ currentPhase }: Props) {
  const currentIdx = PHASES.indexOf(currentPhase);

  return (
    <div className={styles.wrapper} id="phase-indicator">
      <h3 className={styles.title}>Trial Phases</h3>
      <div className={styles.stepper}>
        {PHASES.map((phase, idx) => {
          const info = PHASE_INFO[phase];
          const isComplete = idx < currentIdx;
          const isCurrent = phase === currentPhase;
          const isFuture = idx > currentIdx;

          return (
            <div
              key={phase}
              className={`${styles.step} ${isComplete ? styles.complete : ""} ${isCurrent ? styles.current : ""} ${isFuture ? styles.future : ""}`}
            >
              <div className={styles.stepLine}>
                <div className={styles.stepDot}>
                  {isComplete ? (
                    <svg viewBox="0 0 16 16" className={styles.check}>
                      <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={styles.stepIcon}>{info?.icon || "•"}</span>
                  )}
                </div>
                {idx < PHASES.length - 1 && <div className={styles.connector} />}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{info?.label || phase}</span>
                {isCurrent && (
                  <span className={styles.stepDesc}>{info?.description || ""}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
