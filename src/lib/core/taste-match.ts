/**
 * Taste Match: how similar two listeners are, 0–100.
 *
 * Three signals, each 0–1:
 *  - artists: rank-biased overlap of top-artist lists (agreement near the top counts most)
 *  - genres:  cosine similarity of genre weight vectors
 *  - ratings: agreement on items both users scored (only if enough overlap)
 */

export interface TasteProfile {
  /** Top artist ids, most-listened first. */
  topArtistIds: string[];
  /** Genre -> weight (any positive scale). */
  genreWeights: Record<string, number>;
  /** itemKey ("track:id", "album:id", "artist:id") -> score 0–10. */
  ratings: Record<string, number>;
}

export interface TasteMatch {
  percent: number;
  breakdown: { artists: number; genres: number; ratings: number | null };
  sharedArtistIds: string[];
  sharedRatedCount: number;
}

const WEIGHTS = { artists: 0.45, genres: 0.35, ratings: 0.2 } as const;
/** Minimum co-rated items before rating agreement is counted. */
export const MIN_SHARED_RATINGS = 3;

/**
 * Rank-biased overlap (Webber et al. 2010), truncated, with persistence p.
 * Returns 0–1; identical lists give 1.
 */
export function rankBiasedOverlap(a: string[], b: string[], p = 0.9): number {
  const depth = Math.max(a.length, b.length);
  if (depth === 0) return 0;
  const seenA = new Set<string>();
  const seenB = new Set<string>();
  let overlap = 0;
  let sum = 0;
  let norm = 0;
  for (let d = 1; d <= depth; d++) {
    const x = a[d - 1];
    const y = b[d - 1];
    if (x !== undefined && !seenA.has(x)) {
      if (seenB.has(x)) overlap++;
      seenA.add(x);
    }
    if (y !== undefined && !seenB.has(y)) {
      if (seenA.has(y)) overlap++;
      seenB.add(y);
    }
    const w = Math.pow(p, d - 1);
    sum += w * (overlap / d);
    norm += w;
  }
  return sum / norm;
}

export function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of Object.entries(a)) {
    na += v * v;
    const w = b[k];
    if (w !== undefined) dot += v * w;
  }
  for (const v of Object.values(b)) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 1 = identical scores, 0 = maximally opposed. Null if too few shared items. */
export function ratingAgreement(
  a: Record<string, number>,
  b: Record<string, number>,
): { value: number | null; shared: number } {
  const diffs: number[] = [];
  for (const [k, v] of Object.entries(a)) {
    const w = b[k];
    if (w !== undefined) diffs.push(Math.abs(v - w));
  }
  if (diffs.length < MIN_SHARED_RATINGS) return { value: null, shared: diffs.length };
  const meanDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  return { value: 1 - meanDiff / 10, shared: diffs.length };
}

export function tasteMatch(a: TasteProfile, b: TasteProfile): TasteMatch {
  const artists = rankBiasedOverlap(a.topArtistIds, b.topArtistIds);
  const genres = cosineSimilarity(a.genreWeights, b.genreWeights);
  const { value: ratings, shared } = ratingAgreement(a.ratings, b.ratings);

  let total: number;
  if (ratings === null) {
    // Redistribute the ratings weight proportionally.
    const w = WEIGHTS.artists + WEIGHTS.genres;
    total = (artists * WEIGHTS.artists + genres * WEIGHTS.genres) / w;
  } else {
    total = artists * WEIGHTS.artists + genres * WEIGHTS.genres + ratings * WEIGHTS.ratings;
  }

  const bSet = new Set(b.topArtistIds);
  return {
    percent: Math.round(Math.min(1, Math.max(0, total)) * 100),
    breakdown: {
      artists: round2(artists),
      genres: round2(genres),
      ratings: ratings === null ? null : round2(ratings),
    },
    sharedArtistIds: a.topArtistIds.filter((id) => bSet.has(id)),
    sharedRatedCount: shared,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
