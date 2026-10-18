import { Navbar } from "@/components/layout/Navbar";
import { TradingCard } from "@/components/cards/TradingCard";
import { RankedItemRow, type RankedItemData } from "@/components/rankings/RankedItemRow";
import type { CardDef } from "@/lib/core/cards";
import styles from "./page.module.css";

const DEMO_CARDS: CardDef[] = [
  {
    id: "card-radiohead",
    category: "top_artist",
    title: "Radiohead",
    subtitle: "Anchor Artist",
    rarity: "legendary",
    stats: [
      { label: "Plays Logged", value: "342" },
      { label: "Share of Listening", value: "38%" },
    ],
    flavorText: "Unapologetic devotion. This artist is your audio fingerprint.",
  },
  {
    id: "card-night",
    category: "night_owl",
    title: "3:00 AM Frequencies",
    subtitle: "Nocturnal Listening",
    rarity: "epic",
    stats: [
      { label: "After-Hours Streams", value: "48%" },
    ],
    flavorText: "Best consumed when the rest of the hemisphere is asleep.",
  },
  {
    id: "card-obscurity",
    category: "obscurity",
    title: "Off-Radar Index",
    subtitle: "Obscurity Score",
    rarity: "rare",
    stats: [
      { label: "Underground Index", value: "58/100" },
    ],
    flavorText: "A healthy balance of charting anthems and hidden gems.",
  },
];

const DEMO_RANKING: RankedItemData[] = [
  {
    position: 1,
    title: "OK Computer",
    artist: "Radiohead",
    userScore: 9.5,
    octiveScore: 96,
    octiveLabel: "Day One",
    plays: 84,
  },
  {
    position: 2,
    title: "Mezzanine",
    artist: "Massive Attack",
    userScore: 9.0,
    octiveScore: 91,
    octiveLabel: "Certified",
    plays: 62,
  },
  {
    position: 3,
    title: "In Rainbows",
    artist: "Radiohead",
    userScore: 9.0,
    octiveScore: 88,
    octiveLabel: "Certified",
    plays: 47,
  },
  {
    position: 4,
    title: "Selected Ambient Works 85-92",
    artist: "Aphex Twin",
    userScore: 8.5,
    octiveScore: 72,
    octiveLabel: "Listener",
    plays: 28,
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.heroBadge}>
            <span className={styles.badgePulse} />
            <span className={styles.badgeText}>Live Streaming Data · Zero Hype</span>
          </div>

          <h1 className={styles.heroTitle}>
            Your taste, <br />
            <span className={styles.heroTitleAccent}>on the record.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Octive turns your real streaming history into collectible trading cards,
            drag-to-rank lists, and the <strong>Octive Credibility Meter</strong> — verifying whether
            that 10/10 rating was earned or just rated off one listen.
          </p>

          <div className={styles.heroActions}>
            <a href="/signin" className={styles.primaryButton}>
              Connect with Spotify
            </a>
            <a href="#cards" className={styles.secondaryButton}>
              Explore Demo Profile ↓
            </a>
          </div>
        </section>

        {/* PROFILE SHOWCASE BANNER */}
        <section className={styles.profileBanner}>
          <div className={styles.profileHeader}>
            <div className={styles.profileIdentity}>
              <div className={styles.profileAvatar}>J</div>
              <div>
                <h2 className={styles.profileHandle}>@jatin</h2>
                <span className={styles.profileMeta}>Toronto, ON · Audiophile & Crate Digger</span>
              </div>
            </div>

            <div className={styles.statsOverview}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>1,420</span>
                <span className={styles.statLabel}>Streams Logged</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>88%</span>
                <span className={styles.statLabel}>Taste Match</span>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxHighlight}`}>
                <span className={styles.statNum}>94 / 100</span>
                <span className={styles.statLabel}>Octive Credibility · Day One</span>
              </div>
            </div>
          </div>
        </section>

        {/* TRADING CARDS SECTION */}
        <section id="cards" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionPretitle}>COLLECTIBLE AUDIO IDENTITY</span>
              <h2 className={styles.sectionTitle}>Stats as Trading Cards</h2>
            </div>
            <p className={styles.sectionDescription}>
              Generated from real listening. Rarity scales from Standard Issue to Legendary Master.
            </p>
          </div>

          <div className={styles.cardsGrid}>
            {DEMO_CARDS.map((card) => (
              <TradingCard key={card.id} card={card} />
            ))}
          </div>
        </section>

        {/* RANKINGS & CREDIBILITY SECTION */}
        <section id="rankings" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionPretitle}>THE DUAL-SCORE STANDARD</span>
              <h2 className={styles.sectionTitle}>Ranked Lists & Octive Credibility</h2>
            </div>
            <p className={styles.sectionDescription}>
              Anyone can type a score. Octive measures the verified hours behind it.
            </p>
          </div>

          <div className={styles.rankingsLayout}>
            <div className={styles.rankingListContainer}>
              <div className={styles.rankingListHeader}>
                <h3 className={styles.rankingListTitle}>Favorite Albums of All Time</h3>
                <span className={styles.rankingListCount}>4 items ranked</span>
              </div>

              <div className={styles.rankingRows}>
                {DEMO_RANKING.map((item) => (
                  <RankedItemRow key={item.position} item={item} />
                ))}
              </div>
            </div>

            {/* AUDIENCE CONSENSUS CARD */}
            <aside className={styles.consensusCard}>
              <span className={styles.consensusPre}>COMMUNITY BENCHMARK</span>
              <h4 className={styles.consensusTitle}>Audience Consensus</h4>
              <p className={styles.consensusText}>
                Rankings are scored by followers. Community scores use a Bayesian weighted
                model so a single outlier doesn&apos;t hijack the leaderboard.
              </p>

              <div className={styles.consensusScoreBox}>
                <span className={styles.consensusScoreNum}>8.8</span>
                <span className={styles.consensusScoreScale}>/ 10</span>
              </div>
              <span className={styles.consensusMeta}>Weighted across 24 friend ratings</span>
            </aside>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.brandTitle}>OCTIVE</span>
            <p className={styles.footerCopy}>
              A social music platform built with Next.js 16 and Supabase. $0 infrastructure cost.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="https://github.com/jatinsrivastava11/octive" target="_blank" rel="noreferrer" className={styles.footerLink}>
              GitHub Repository ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
