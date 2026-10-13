import { isValidScore } from "./octive-rating";
import type { ItemKind } from "./types";

/**
 * Ranked lists: drag-to-order items, each with a 0–10 score.
 * Other users score the whole ranking out of 10.
 */

export const MAX_RANKING_ITEMS = 100;
export const RANKING_TITLE_MAX = 80;

export interface RankingItem {
  itemId: string;
  kind: ItemKind;
  score: number;
}

/** Move an item from one index to another (immutable). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return [...items];
  const clampedTo = Math.max(0, Math.min(items.length - 1, to));
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(clampedTo, 0, moved as T);
  return next;
}

export type RankingError =
  | "empty"
  | "too_many"
  | "duplicate_item"
  | "mixed_kinds"
  | "invalid_score"
  | "bad_title";

export function validateRanking(title: string, items: readonly RankingItem[]): RankingError | null {
  const t = title.trim();
  if (t.length === 0 || t.length > RANKING_TITLE_MAX) return "bad_title";
  if (items.length === 0) return "empty";
  if (items.length > MAX_RANKING_ITEMS) return "too_many";
  const kind = items[0]!.kind;
  const seen = new Set<string>();
  for (const it of items) {
    if (it.kind !== kind) return "mixed_kinds";
    if (seen.has(it.itemId)) return "duplicate_item";
    seen.add(it.itemId);
    if (!isValidScore(it.score)) return "invalid_score";
  }
  return null;
}

/**
 * Bayesian average of other users' scores for a ranking, so one 10/10
 * doesn't top the leaderboard. Prior: PRIOR_WEIGHT votes at PRIOR_MEAN.
 */
export const PRIOR_MEAN = 6;
export const PRIOR_WEIGHT = 3;

export function communityScore(scores: readonly number[]): { mean: number | null; weighted: number; count: number } {
  const count = scores.length;
  const sum = scores.reduce((s, v) => s + v, 0);
  const weighted = (PRIOR_MEAN * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + count);
  return {
    mean: count === 0 ? null : round1(sum / count),
    weighted: round1(weighted),
    count,
  };
}

/** Flags rankings whose order disagrees with their own scores (higher-ranked item scored lower). */
export function orderInconsistencies(items: readonly RankingItem[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < items.length; i++) {
    if (items[i]!.score > items[i - 1]!.score) out.push(i);
  }
  return out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
