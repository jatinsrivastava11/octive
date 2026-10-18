import type { OctiveLabel } from "@/lib/core/octive-rating";
import { OctiveMeter } from "@/components/ratings/OctiveMeter";
import styles from "./RankedItemRow.module.css";

export interface RankedItemData {
  position: number;
  title: string;
  artist: string;
  imageUrl?: string;
  userScore: number;
  octiveScore: number;
  octiveLabel: OctiveLabel;
  plays: number;
}

interface RankedItemRowProps {
  item: RankedItemData;
}

export function RankedItemRow({ item }: RankedItemRowProps) {
  const formattedPos = String(item.position).padStart(2, "0");

  return (
    <div className={styles.row}>
      <span className={styles.position}>{formattedPos}</span>

      <div className={styles.media}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.title} className={styles.art} />
        ) : (
          <div className={styles.artPlaceholder}>
            <span className={styles.artIcon}>LP</span>
          </div>
        )}
      </div>

      <div className={styles.meta}>
        <h4 className={styles.title}>{item.title}</h4>
        <span className={styles.artist}>— {item.artist}</span>
      </div>

      <div className={styles.scoreContainer}>
        <span className={styles.scoreNumber}>{item.userScore.toFixed(1)}</span>
        <span className={styles.scoreScale}>/ 10</span>
      </div>

      <div className={styles.meterContainer}>
        <OctiveMeter
          score={item.octiveScore}
          label={item.octiveLabel}
          plays={item.plays}
        />
      </div>
    </div>
  );
}
