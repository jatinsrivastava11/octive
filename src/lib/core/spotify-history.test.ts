import { describe, expect, it } from "vitest";
import { parseSpotifyHistory } from "./spotify-history";

const ID = "4uLU6hMCjMI75M1A2tKUQC";

describe("parseSpotifyHistory: extended", () => {
  const base = {
    ts: "2025-01-02T10:00:00Z",
    ms_played: 200_000,
    master_metadata_track_name: "Song",
    master_metadata_album_artist_name: "Artist",
    master_metadata_album_album_name: "Album",
    spotify_track_uri: `spotify:track:${ID}`,
  };

  it("parses a valid play", () => {
    const r = parseSpotifyHistory([base]);
    expect(r.format).toBe("extended");
    expect(r.plays).toHaveLength(1);
    expect(r.plays[0]).toMatchObject({ trackId: ID, trackName: "Song", artistName: "Artist" });
  });

  it("skips plays under 30 seconds", () => {
    const r = parseSpotifyHistory([{ ...base, ms_played: 29_999 }]);
    expect(r.plays).toHaveLength(0);
    expect(r.skipped.tooShort).toBe(1);
  });

  it("skips podcasts / missing URIs", () => {
    const r = parseSpotifyHistory([
      { ...base, spotify_track_uri: null, master_metadata_track_name: null },
    ]);
    expect(r.skipped.notMusic).toBe(1);
  });

  it("dedupes identical plays and sorts by time", () => {
    const later = { ...base, ts: "2025-01-03T10:00:00Z" };
    const r = parseSpotifyHistory([later, base, base]);
    expect(r.plays.map((p) => p.playedAt)).toEqual([
      "2025-01-02T10:00:00.000Z",
      "2025-01-03T10:00:00.000Z",
    ]);
    expect(r.skipped.duplicate).toBe(1);
  });

  it("counts malformed rows as invalid", () => {
    const r = parseSpotifyHistory([base, { ts: "x" }]);
    expect(r.plays).toHaveLength(1);
    expect(r.skipped.invalid).toBe(1);
  });
});

describe("parseSpotifyHistory: legacy", () => {
  it("parses account-data format without track ids", () => {
    const r = parseSpotifyHistory([
      { endTime: "2024-03-01 14:05", artistName: "A", trackName: "T", msPlayed: 60_000 },
    ]);
    expect(r.format).toBe("legacy");
    expect(r.plays[0]).toMatchObject({ trackId: null, playedAt: "2024-03-01T14:05:00.000Z" });
  });
});

describe("parseSpotifyHistory: unknown", () => {
  it("returns nothing for non-arrays and unknown shapes", () => {
    expect(parseSpotifyHistory({}).format).toBe("unknown");
    expect(parseSpotifyHistory([{ foo: 1 }]).format).toBe("unknown");
  });
});
