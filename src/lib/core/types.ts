/**
 * Shared domain types. Pure data, no I/O.
 */

export type ItemKind = "track" | "album" | "artist";

/** A rating score on Octive's 0–10 scale (half steps allowed). */
export type Score = number;

export interface ArtistRef {
  id: string;
  name: string;
  genres: string[];
  /** Provider popularity, 0–100 (Spotify). */
  popularity: number;
  imageUrl?: string;
}

export interface TrackRef {
  id: string;
  name: string;
  artistIds: string[];
  albumId: string;
  popularity: number;
  durationMs: number;
  /** Release year of the album the track belongs to. */
  releaseYear: number | null;
  explicit: boolean;
}

export interface Play {
  trackId: string;
  /** ISO timestamp. */
  playedAt: string;
}

export type Rarity = "common" | "rare" | "epic" | "legendary";
