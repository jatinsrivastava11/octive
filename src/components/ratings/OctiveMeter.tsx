import type { OctiveLabel } from "@/lib/core/octive-rating";
import styles from "./OctiveMeter.module.css";

interface OctiveMeterProps {
  score: number; // 0-100 credibility score
  label: OctiveLabel;
  plays: number;
  showPlays?: boolean;
}

export function OctiveMeter({ score, label, plays, showPlays = true }: OctiveMeterProps) {
  // Determine credibility tier color indicator
  const tierClass =
    score >= 80 ? styles.tierHigh : score >= 50 ? styles.tierMid : styles.tierLow;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Octive Credibility Meter</span>
        <span className={`${styles.statusDot} ${tierClass}`} />
      </div>

      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${tierClass}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      <div className={styles.meta}>
        <span className={styles.labelText}>
          {score}/100 · {label}
        </span>
        {showPlays && (
          <span className={styles.playsText}>
            {plays} Verified {plays === 1 ? "Play" : "Plays"}
          </span>
        )}
      </div>
    </div>
  );
}
