import { describe, expect, it } from "vitest";
import {
  extremity,
  isValidScore,
  labelFor,
  octiveRating,
  requiredTrackPlays,
} from "./octive-rating";

describe("extremity", () => {
  it("is 0 at the midpoint and 1 at the ends", () => {
    expect(extremity(5.5)).toBe(0);
    expect(extremity(10)).toBe(1);
    expect(extremity(1)).toBe(1);
    expect(extremity(0)).toBe(1);
  });
});

describe("isValidScore", () => {
  it("accepts half steps in range", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(9.5)).toBe(true);
    expect(isValidScore(10)).toBe(true);
  });
  it("rejects out of range and non-half steps", () => {
    expect(isValidScore(-0.5)).toBe(false);
    expect(isValidScore(10.5)).toBe(false);
    expect(isValidScore(7.3)).toBe(false);
    expect(isValidScore(Number.NaN)).toBe(false);
  });
});

describe("requiredTrackPlays", () => {
  it("needs ~3 plays for a middle score and ~10 for extremes", () => {
    expect(requiredTrackPlays(5.5)).toBe(3);
    expect(requiredTrackPlays(6)).toBeLessThan(4);
    expect(requiredTrackPlays(9.5)).toBeGreaterThan(8);
    expect(requiredTrackPlays(0)).toBe(10);
  });
});

describe("octiveRating: tracks", () => {
  it("gives 0 and 'No Plays' with no listening", () => {
    const r = octiveRating({ kind: "track", score: 8, plays: 0 });
    expect(r.value).toBe(0);
    expect(r.label).toBe("No Plays");
  });

  it("scores a 9.5 after one play low", () => {
    const r = octiveRating({ kind: "track", score: 9.5, plays: 1 });
    expect(r.value).toBeLessThan(35);
    expect(r.label).toBe("Heard It Once");
  });

  it("scores a mid rating after 3 plays as fully credible", () => {
    const r = octiveRating({ kind: "track", score: 5.5, plays: 3 });
    expect(r.value).toBe(100);
  });

  it("holds extreme scores to a higher bar than mid scores at equal plays", () => {
    const mid = octiveRating({ kind: "track", score: 6, plays: 3 });
    const high = octiveRating({ kind: "track", score: 10, plays: 3 });
    const low = octiveRating({ kind: "track", score: 0, plays: 3 });
    expect(high.value).toBeLessThan(mid.value);
    expect(low.value).toBeLessThan(mid.value);
  });

  it("is monotonic in plays", () => {
    let prev = -1;
    for (let p = 0; p <= 15; p++) {
      const v = octiveRating({ kind: "track", score: 9, plays: p }).value;
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("caps at 100", () => {
    expect(octiveRating({ kind: "track", score: 10, plays: 500 }).value).toBe(100);
  });

  it("throws on invalid scores", () => {
    expect(() => octiveRating({ kind: "track", score: 11, plays: 1 })).toThrow(RangeError);
  });
});

describe("octiveRating: albums", () => {
  it("penalises rating an album after hearing one track", () => {
    const r = octiveRating({ kind: "album", score: 9, plays: 20, tracksHeard: 1, totalTracks: 12 });
    expect(r.value).toBeLessThan(45);
  });

  it("rewards full coverage with repeat listens", () => {
    const r = octiveRating({ kind: "album", score: 9, plays: 30, tracksHeard: 12, totalTracks: 12 });
    expect(r.value).toBe(100);
  });

  it("requires more coverage for extreme scores", () => {
    const base = { kind: "album" as const, plays: 40, tracksHeard: 8, totalTracks: 12 };
    const mid = octiveRating({ ...base, score: 6 });
    const extreme = octiveRating({ ...base, score: 10 });
    expect(extreme.value).toBeLessThan(mid.value);
    expect(extreme.needed.coverage).toBe(1);
  });

  it("handles a zero-track album defensively", () => {
    const r = octiveRating({ kind: "album", score: 5, plays: 0, tracksHeard: 0, totalTracks: 0 });
    expect(r.value).toBe(0);
  });
});

describe("octiveRating: artists", () => {
  it("penalises looping a single song", () => {
    const r = octiveRating({ kind: "artist", score: 10, plays: 200, distinctTracksHeard: 1, catalogSize: 80 });
    expect(r.value).toBeLessThan(40);
  });

  it("rewards depth across the catalog", () => {
    const r = octiveRating({ kind: "artist", score: 10, plays: 200, distinctTracksHeard: 40, catalogSize: 80 });
    expect(r.value).toBe(100);
    expect(r.label).toBe("Day One");
  });

  it("does not require more distinct songs than the catalog has", () => {
    const r = octiveRating({ kind: "artist", score: 10, plays: 60, distinctTracksHeard: 4, catalogSize: 4 });
    expect(r.needed.distinctTracks).toBe(4);
    expect(r.value).toBe(100);
  });
});

describe("confidence", () => {
  it("is provisional with little history and no import", () => {
    expect(octiveRating({ kind: "track", score: 7, plays: 3, historyDays: 3 }).confidence).toBe("provisional");
  });
  it("is tracked after an import", () => {
    expect(
      octiveRating({ kind: "track", score: 7, plays: 3, historyDays: 3, hasHistoryImport: true }).confidence,
    ).toBe("tracked");
  });
});

describe("labelFor", () => {
  it("maps bands", () => {
    expect(labelFor(10, 5, "album")).toBe("Barely Heard");
    expect(labelFor(30, 5, "album")).toBe("Casual");
    expect(labelFor(60, 5, "album")).toBe("Listener");
    expect(labelFor(80, 5, "album")).toBe("Certified");
    expect(labelFor(95, 5, "album")).toBe("Day One");
  });
});
