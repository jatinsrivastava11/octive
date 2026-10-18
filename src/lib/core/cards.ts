import type { Rarity } from "./types";
export type { Rarity } from "./types";

/**
 * Card engine: generates collectible trading cards from listening stats.
 * Rarity tiers:
 *  - common (bronze/bone)
 *  - rare (cobalt)
 *  - epic (orchid)
 *  - legendary (amber/gold)
 */

export type CardCategory =
  | "top_artist"
  | "genre_dna"
  | "night_owl"
  | "decade_diver"
  | "obscurity"
  | "marathon"
  | "streak";

export interface CardDef {
  id: string;
  category: CardCategory;
  title: string;
  subtitle: string;
  rarity: Rarity;
  stats: {
    label: string;
    value: string;
  }[];
  flavorText: string;
}

export interface UserStatsSnapshot {
  topArtist: {
    name: string;
    plays: number;
    percentOfTotal: number;
  } | null;
  dominantGenre: {
    name: string;
    percent: number;
  } | null;
  nightListeningPercent: number; // 0–100, listening between 12am and 5am
  obscurityScore: number; // 0–100, 100 = most obscure (100 - avg_popularity)
  favoriteDecade: {
    decade: string; // e.g., "1970s", "1990s"
    percent: number;
  } | null;
  weeklyStreak: number; // consecutive weeks with 50+ plays
  weeklyPlayCount: number;
}

/** Determine rarity based on exclusivity / percentiles */
export function calculateRarity(category: CardCategory, stats: UserStatsSnapshot): Rarity {
  switch (category) {
    case "top_artist": {
      const pct = stats.topArtist?.percentOfTotal ?? 0;
      if (pct >= 40) return "legendary";
      if (pct >= 25) return "epic";
      if (pct >= 15) return "rare";
      return "common";
    }

    case "obscurity": {
      const obs = stats.obscurityScore;
      if (obs >= 75) return "legendary"; // Deep underground
      if (obs >= 60) return "epic";
      if (obs >= 45) return "rare";
      return "common";
    }

    case "night_owl": {
      const night = stats.nightListeningPercent;
      if (night >= 60) return "legendary";
      if (night >= 40) return "epic";
      if (night >= 25) return "rare";
      return "common";
    }

    case "genre_dna": {
      const pct = stats.dominantGenre?.percent ?? 0;
      if (pct >= 60) return "legendary"; // Pure purist
      if (pct >= 40) return "epic";
      if (pct >= 25) return "rare";
      return "common";
    }

    case "decade_diver": {
      const dec = stats.favoriteDecade;
      if (!dec) return "common";
      // Listening mostly to pre-2000s in modern streaming is rarer
      const isVintage = dec.decade.startsWith("19");
      if (isVintage && dec.percent >= 35) return "legendary";
      if (dec.percent >= 40) return "epic";
      if (dec.percent >= 25) return "rare";
      return "common";
    }

    case "streak": {
      if (stats.weeklyStreak >= 26) return "legendary"; // Half year
      if (stats.weeklyStreak >= 12) return "epic";
      if (stats.weeklyStreak >= 4) return "rare";
      return "common";
    }

    case "marathon": {
      if (stats.weeklyPlayCount >= 700) return "legendary"; // 100+ plays/day
      if (stats.weeklyPlayCount >= 400) return "epic";
      if (stats.weeklyPlayCount >= 200) return "rare";
      return "common";
    }
  }
}

/** Generates the full set of cards available for a user from their snapshot */
export function generateCards(stats: UserStatsSnapshot): CardDef[] {
  const cards: CardDef[] = [];

  if (stats.topArtist) {
    const rarity = calculateRarity("top_artist", stats);
    cards.push({
      id: "card-top-artist",
      category: "top_artist",
      title: stats.topArtist.name,
      subtitle: "Anchor Artist",
      rarity,
      stats: [
        { label: "Plays Logged", value: stats.topArtist.plays.toLocaleString() },
        { label: "Share of Listening", value: `${Math.round(stats.topArtist.percentOfTotal)}%` },
      ],
      flavorText:
        rarity === "legendary"
          ? "Unapologetic devotion. This artist is your audio fingerprint."
          : rarity === "epic"
          ? "In heavy rotation through all seasons and moods."
          : "Your primary sonic anchor this period.",
    });
  }

  if (stats.dominantGenre) {
    const rarity = calculateRarity("genre_dna", stats);
    cards.push({
      id: "card-genre-dna",
      category: "genre_dna",
      title: stats.dominantGenre.name.toUpperCase(),
      subtitle: "Dominant Frequency",
      rarity,
      stats: [
        { label: "Genre Weight", value: `${Math.round(stats.dominantGenre.percent)}%` },
      ],
      flavorText: "The sonic territory you return to when the noise fades.",
    });
  }

  if (stats.obscurityScore > 20) {
    const rarity = calculateRarity("obscurity", stats);
    cards.push({
      id: "card-obscurity",
      category: "obscurity",
      title: rarity === "legendary" ? "Crate Digger" : "Off-Radar",
      subtitle: "Obscurity Index",
      rarity,
      stats: [
        { label: "Underground Index", value: `${Math.round(stats.obscurityScore)}/100` },
      ],
      flavorText:
        stats.obscurityScore >= 70
          ? "Found in dusty corners and underground basements before the algorithm caught on."
          : "A healthy balance of charting anthems and hidden gems.",
    });
  }

  if (stats.nightListeningPercent >= 20) {
    const rarity = calculateRarity("night_owl", stats);
    cards.push({
      id: "card-night-owl",
      category: "night_owl",
      title: "3:00 AM Frequencies",
      subtitle: "Nocturnal Listening",
      rarity,
      stats: [
        { label: "After-Hours Streams", value: `${Math.round(stats.nightListeningPercent)}%` },
      ],
      flavorText: "Best consumed when the rest of the hemisphere is asleep.",
    });
  }

  if (stats.favoriteDecade) {
    const rarity = calculateRarity("decade_diver", stats);
    cards.push({
      id: "card-decade-diver",
      category: "decade_diver",
      title: `${stats.favoriteDecade.decade} Revival`,
      subtitle: "Time Capsule",
      rarity,
      stats: [
        { label: "Decade Focus", value: `${Math.round(stats.favoriteDecade.percent)}%` },
      ],
      flavorText: `Proof that great records don't have an expiration date.`,
    });
  }

  if (stats.weeklyStreak >= 2) {
    const rarity = calculateRarity("streak", stats);
    cards.push({
      id: "card-streak",
      category: "streak",
      title: `${stats.weeklyStreak}-Week Pulse`,
      subtitle: "Listening Cadence",
      rarity,
      stats: [
        { label: "Active Weeks", value: `${stats.weeklyStreak}` },
      ],
      flavorText: "Unbroken rhythm. Day in, day out.",
    });
  }

  return cards;
}
