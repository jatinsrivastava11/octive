/**
 * Badges and Achievements engine for Octive.
 * Pure logic, deterministic unlock evaluations.
 */

export type BadgeId =
  | "early_listener"
  | "genre_hopper"
  | "album_purist"
  | "deep_cuts"
  | "centurion"
  | "certified_ear"
  | "night_crawler"
  | "taste_twin";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  category: "listening" | "curation" | "social";
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export const BADGE_REGISTRY: Record<BadgeId, BadgeDefinition> = {
  early_listener: {
    id: "early_listener",
    name: "Ground Floor",
    description: "Streamed an artist before their platform popularity crossed 30.",
    category: "listening",
    tier: "gold",
  },
  genre_hopper: {
    id: "genre_hopper",
    name: "Sonic Nomad",
    description: "Explored 15 or more distinct genres within a single tracking period.",
    category: "listening",
    tier: "silver",
  },
  album_purist: {
    id: "album_purist",
    name: "Front to Back",
    description: "Completed 5 or more full album playthroughs with zero skips.",
    category: "listening",
    tier: "silver",
  },
  deep_cuts: {
    id: "deep_cuts",
    name: "Deep Cuts Only",
    description: "Streamed 10 or more non-singles from an artist's back catalog.",
    category: "listening",
    tier: "bronze",
  },
  centurion: {
    id: "centurion",
    name: "Heavy Rotation",
    description: "Logged over 100 verified streams in a single week.",
    category: "listening",
    tier: "bronze",
  },
  certified_ear: {
    id: "certified_ear",
    name: "Ear for Truth",
    description: "Maintained a 90+ Octive Credibility Rating across 3 or more ranked items.",
    category: "curation",
    tier: "gold",
  },
  night_crawler: {
    id: "night_crawler",
    name: "Night Owl",
    description: "Streamed music after 2:00 AM across 4 separate sessions.",
    category: "listening",
    tier: "bronze",
  },
  taste_twin: {
    id: "taste_twin",
    name: "Harmonic Convergence",
    description: "Reached an 85% or higher Taste Match with another profile.",
    category: "social",
    tier: "platinum",
  },
};

export interface BadgeEvaluationContext {
  lowestArtistPopularitySeen?: number;
  distinctGenresCount?: number;
  fullAlbumPlaythroughs?: number;
  deepCutPlaysCount?: number;
  weeklyStreamCount?: number;
  certifiedRatingsCount?: number; // count of ratings with Octive score >= 90
  lateNightSessionCount?: number;
  highestTasteMatchPercent?: number;
}

/** Evaluates whether specific badge requirements are met */
export function checkBadgeUnlocked(badgeId: BadgeId, ctx: BadgeEvaluationContext): boolean {
  switch (badgeId) {
    case "early_listener":
      return (ctx.lowestArtistPopularitySeen ?? 100) < 30;
    case "genre_hopper":
      return (ctx.distinctGenresCount ?? 0) >= 15;
    case "album_purist":
      return (ctx.fullAlbumPlaythroughs ?? 0) >= 5;
    case "deep_cuts":
      return (ctx.deepCutPlaysCount ?? 0) >= 10;
    case "centurion":
      return (ctx.weeklyStreamCount ?? 0) >= 100;
    case "certified_ear":
      return (ctx.certifiedRatingsCount ?? 0) >= 3;
    case "night_crawler":
      return (ctx.lateNightSessionCount ?? 0) >= 4;
    case "taste_twin":
      return (ctx.highestTasteMatchPercent ?? 0) >= 85;
  }
}

/** Returns all unlocked badge IDs for given context */
export function evaluateAllBadges(ctx: BadgeEvaluationContext): BadgeId[] {
  const unlocked: BadgeId[] = [];
  for (const id of Object.keys(BADGE_REGISTRY) as BadgeId[]) {
    if (checkBadgeUnlocked(id, ctx)) {
      unlocked.push(id);
    }
  }
  return unlocked;
}
