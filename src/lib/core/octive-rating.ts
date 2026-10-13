import type { ItemKind, Score } from "./types";

/**
 * Octive rating: how well a user's score is backed by real listening.
 *
 * The user's score is never changed. This produces a separate 0–100
 * credibility value shown next to it.
 *
 * Core idea: the further a score is from the middle of the scale, the more
 * listening it takes to be credible. "Heard once, 6/10" is reasonable.
 * "Heard once, 10/10" is not.
 */

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;
const MIDPOINT = 5.5;
const HALF_RANGE = 4.5;

/** Diminishing returns on plays beyond what is needed. <1 rewards the first few plays most. */
const PLAY_CURVE = 0.6;

export type OctiveLabel =
  | "No Plays"
  | "Heard It Once"
  | "Barely Heard"
  | "Casual"
  | "Listener"
  | "Certified"
  | "Day One";

export type DataConfidence = "tracked" | "provisional";

interface BaseInput {
  score: Score;
  /** Total counted plays (≥30s each) for this item. */
  plays: number;
  /**
   * Days of play history Octive has for this user (tracking + imports).
   * Under PROVISIONAL_DAYS with no import, results are marked provisional.
   */
  historyDays?: number;
  hasHistoryImport?: boolean;
}

export interface TrackInput extends BaseInput {
  kind: "track";
}

export interface AlbumInput extends BaseInput {
  kind: "album";
  /** Distinct tracks of this album the user has played. */
  tracksHeard: number;
  totalTracks: number;
}

export interface ArtistInput extends BaseInput {
  kind: "artist";
  /** Distinct songs by this artist the user has played. */
  distinctTracksHeard: number;
  /** Size of the artist's catalog we know of (upper bound for depth). */
  catalogSize: number;
}

export type OctiveInput = TrackInput | AlbumInput | ArtistInput;

export interface OctiveResult {
  kind: ItemKind;
  /** 0–100, integer. */
  value: number;
  label: OctiveLabel;
  confidence: DataConfidence;
  /** What the user would need for full credibility, for UI hints. */
  needed: { plays: number; coverage?: number; distinctTracks?: number };
}

export const PROVISIONAL_DAYS = 14;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 0 at the middle of the scale, 1 at (or beyond) the extremes. */
export function extremity(score: Score): number {
  return clamp(Math.abs(score - MIDPOINT) / HALF_RANGE, 0, 1);
}

/** Validates a score: 0–10 in half steps. */
export function isValidScore(score: number): boolean {
  return (
    Number.isFinite(score) &&
    score >= SCORE_MIN &&
    score <= SCORE_MAX &&
    Number.isInteger(score * 2)
  );
}

function playFactor(plays: number, required: number): number {
  if (plays <= 0) return 0;
  return Math.pow(clamp(plays / required, 0, 1), PLAY_CURVE);
}

/** Plays a single track needs: 3 at the midpoint, 10 at the extremes. */
export function requiredTrackPlays(score: Score): number {
  return 3 + 7 * Math.pow(extremity(score), 1.5);
}

function computeRaw(input: OctiveInput): { raw: number; needed: OctiveResult["needed"] } {
  const e = extremity(input.score);

  switch (input.kind) {
    case "track": {
      const required = requiredTrackPlays(input.score);
      return { raw: playFactor(input.plays, required), needed: { plays: Math.ceil(required) } };
    }

    case "album": {
      const total = Math.max(1, input.totalTracks);
      const coverage = clamp(input.tracksHeard / total, 0, 1);
      // Mid scores need 60% of the album heard; extreme scores need all of it.
      const requiredCoverage = 0.6 + 0.4 * e;
      const coverageFactor = clamp(coverage / requiredCoverage, 0, 1);
      // Roughly 1 to 2.5 full listens' worth of plays.
      const requiredPlays = total * (1 + 1.5 * e);
      const pf = playFactor(input.plays, requiredPlays);
      return {
        raw: Math.pow(coverageFactor, 0.6) * Math.pow(pf, 0.4),
        needed: { plays: Math.ceil(requiredPlays), coverage: Math.round(requiredCoverage * 100) / 100 },
      };
    }

    case "artist": {
      const catalog = Math.max(1, input.catalogSize);
      const requiredDistinct = Math.min(catalog, Math.round(5 + 15 * e));
      const depth = clamp(input.distinctTracksHeard / requiredDistinct, 0, 1);
      const requiredPlays = 10 + 40 * e;
      const pf = playFactor(input.plays, requiredPlays);
      return {
        raw: Math.pow(depth, 0.6) * Math.pow(pf, 0.4),
        needed: { plays: Math.ceil(requiredPlays), distinctTracks: requiredDistinct },
      };
    }
  }
}

export function labelFor(value: number, plays: number, kind: ItemKind): OctiveLabel {
  if (plays <= 0) return "No Plays";
  if (kind === "track" && plays === 1) return "Heard It Once";
  if (value < 20) return "Barely Heard";
  if (value < 45) return "Casual";
  if (value < 70) return "Listener";
  if (value < 90) return "Certified";
  return "Day One";
}

export function octiveRating(input: OctiveInput): OctiveResult {
  if (!isValidScore(input.score)) {
    throw new RangeError(`Invalid score ${input.score}: must be 0–10 in steps of 0.5`);
  }
  const plays = Math.max(0, Math.floor(input.plays));
  const { raw, needed } = computeRaw({ ...input, plays });
  const value = Math.round(clamp(raw, 0, 1) * 100);

  const provisional =
    !input.hasHistoryImport && (input.historyDays ?? Infinity) < PROVISIONAL_DAYS;

  return {
    kind: input.kind,
    value,
    label: labelFor(value, plays, input.kind),
    confidence: provisional ? "provisional" : "tracked",
    needed,
  };
}
