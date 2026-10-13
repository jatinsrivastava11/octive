import { z } from "zod";

/**
 * Parses Spotify's privacy data exports into normalised plays.
 *
 * Supports:
 *  - Extended Streaming History (Streaming_History_Audio_*.json): has track URIs.
 *  - Account data StreamingHistory*.json (legacy, last year only): no URIs, matched by name later.
 *
 * A play counts if ms_played >= 30s (Spotify's own stream definition).
 */

export const MIN_PLAY_MS = 30_000;

const extendedEntry = z.object({
  ts: z.string(),
  ms_played: z.number(),
  master_metadata_track_name: z.string().nullable().optional(),
  master_metadata_album_artist_name: z.string().nullable().optional(),
  master_metadata_album_album_name: z.string().nullable().optional(),
  spotify_track_uri: z.string().nullable().optional(),
});

const legacyEntry = z.object({
  endTime: z.string(),
  artistName: z.string(),
  trackName: z.string(),
  msPlayed: z.number(),
});

export interface ImportedPlay {
  /** Spotify track id, if known. */
  trackId: string | null;
  playedAt: string;
  msPlayed: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
}

export interface ImportResult {
  plays: ImportedPlay[];
  format: "extended" | "legacy" | "unknown";
  skipped: { tooShort: number; notMusic: number; invalid: number; duplicate: number };
}

function trackIdFromUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const m = /^spotify:track:([A-Za-z0-9]{22})$/.exec(uri);
  return m ? m[1]! : null;
}

/** "2024-03-01 14:05" (legacy, UTC) -> ISO. */
function legacyTimeToIso(s: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!)).toISOString();
}

function dedupeKey(p: ImportedPlay): string {
  return `${p.trackId ?? `${p.artistName}|${p.trackName}`}@${p.playedAt}`;
}

export function parseSpotifyHistory(json: unknown): ImportResult {
  const skipped = { tooShort: 0, notMusic: 0, invalid: 0, duplicate: 0 };
  if (!Array.isArray(json) || json.length === 0) {
    return { plays: [], format: "unknown", skipped };
  }

  const first = json[0] as Record<string, unknown>;
  const format: ImportResult["format"] =
    "ts" in first ? "extended" : "endTime" in first ? "legacy" : "unknown";
  if (format === "unknown") return { plays: [], format, skipped };

  const seen = new Set<string>();
  const plays: ImportedPlay[] = [];

  for (const raw of json) {
    let play: ImportedPlay | null = null;

    if (format === "extended") {
      const r = extendedEntry.safeParse(raw);
      if (!r.success) { skipped.invalid++; continue; }
      const e = r.data;
      const trackId = trackIdFromUri(e.spotify_track_uri);
      if (!trackId || !e.master_metadata_track_name) { skipped.notMusic++; continue; }
      if (e.ms_played < MIN_PLAY_MS) { skipped.tooShort++; continue; }
      const t = new Date(e.ts);
      if (Number.isNaN(t.getTime())) { skipped.invalid++; continue; }
      play = {
        trackId,
        playedAt: t.toISOString(),
        msPlayed: e.ms_played,
        trackName: e.master_metadata_track_name,
        artistName: e.master_metadata_album_artist_name ?? "",
        albumName: e.master_metadata_album_album_name ?? null,
      };
    } else {
      const r = legacyEntry.safeParse(raw);
      if (!r.success) { skipped.invalid++; continue; }
      const e = r.data;
      if (e.msPlayed < MIN_PLAY_MS) { skipped.tooShort++; continue; }
      const iso = legacyTimeToIso(e.endTime);
      if (!iso) { skipped.invalid++; continue; }
      play = {
        trackId: null,
        playedAt: iso,
        msPlayed: e.msPlayed,
        trackName: e.trackName,
        artistName: e.artistName,
        albumName: null,
      };
    }

    const key = dedupeKey(play);
    if (seen.has(key)) { skipped.duplicate++; continue; }
    seen.add(key);
    plays.push(play);
  }

  plays.sort((a, b) => a.playedAt.localeCompare(b.playedAt));
  return { plays, format, skipped };
}
