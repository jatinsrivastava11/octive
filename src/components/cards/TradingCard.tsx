import type { CardDef, Rarity } from "@/lib/core/cards";
import styles from "./TradingCard.module.css";

interface TradingCardProps {
  card: CardDef;
}

const RARITY_LABELS: Record<Rarity, string> = {
  common: "STANDARD ISSUE",
  rare: "RARE PRESSING",
  epic: "EPIC CUT",
  legendary: "LEGENDARY MASTER",
};

export function TradingCard({ card }: TradingCardProps) {
  return (
    <article className={`${styles.card} ${styles[card.rarity]}`}>
      <div className={styles.header}>
        <span className={styles.brandMark}>OCTIVE</span>
        <span className={styles.rarityBadge}>{RARITY_LABELS[card.rarity]}</span>
      </div>

      <div className={styles.body}>
        <span className={styles.subtitle}>{card.subtitle}</span>
        <h3 className={styles.title}>{card.title}</h3>
      </div>

      <div className={styles.stats}>
        {card.stats.map((stat, idx) => (
          <div key={idx} className={styles.statRow}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.flavorText}>{card.flavorText}</p>
      </div>
    </article>
  );
}
