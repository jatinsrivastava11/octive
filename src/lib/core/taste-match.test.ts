import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  rankBiasedOverlap,
  ratingAgreement,
  tasteMatch,
  type TasteProfile,
} from "./taste-match";

describe("rankBiasedOverlap", () => {
  it("is 1 for identical lists", () => {
    expect(rankBiasedOverlap(["a", "b", "c"], ["a", "b", "c"])).toBeCloseTo(1, 5);
  });
  it("is 0 for disjoint lists", () => {
    expect(rankBiasedOverlap(["a", "b"], ["x", "y"])).toBe(0);
  });
  it("weights agreement at the top more than at the bottom", () => {
    const topAgree = rankBiasedOverlap(["a", "b", "c", "d"], ["a", "x", "y", "z"]);
    const bottomAgree = rankBiasedOverlap(["a", "b", "c", "d"], ["x", "y", "z", "d"]);
    expect(topAgree).toBeGreaterThan(bottomAgree);
  });
  it("is symmetric", () => {
    const a = ["a", "b", "c", "d"];
    const b = ["c", "a", "e"];
    expect(rankBiasedOverlap(a, b)).toBeCloseTo(rankBiasedOverlap(b, a), 10);
  });
  it("handles empty lists", () => {
    expect(rankBiasedOverlap([], [])).toBe(0);
  });
});

describe("cosineSimilarity", () => {
  it("is 1 for proportional vectors", () => {
    expect(cosineSimilarity({ rock: 2, jazz: 1 }, { rock: 4, jazz: 2 })).toBeCloseTo(1, 10);
  });
  it("is 0 with no shared genres", () => {
    expect(cosineSimilarity({ rock: 1 }, { jazz: 1 })).toBe(0);
  });
  it("is 0 for empty vectors", () => {
    expect(cosineSimilarity({}, { jazz: 1 })).toBe(0);
  });
});

describe("ratingAgreement", () => {
  it("returns null below the minimum overlap", () => {
    expect(ratingAgreement({ "t:1": 5 }, { "t:1": 5 }).value).toBeNull();
  });
  it("is 1 for identical scores", () => {
    const r = { "t:1": 7, "t:2": 3, "t:3": 9 };
    expect(ratingAgreement(r, r).value).toBe(1);
  });
  it("is 0 when fully opposed", () => {
    const a = { "t:1": 0, "t:2": 0, "t:3": 0 };
    const b = { "t:1": 10, "t:2": 10, "t:3": 10 };
    expect(ratingAgreement(a, b).value).toBe(0);
  });
});

describe("tasteMatch", () => {
  const alice: TasteProfile = {
    topArtistIds: ["radiohead", "bjork", "portishead", "massive"],
    genreWeights: { "art rock": 5, "trip hop": 4, electronic: 2 },
    ratings: { "album:okc": 10, "album:homo": 9, "album:dummy": 8 },
  };

  it("is 100 against yourself", () => {
    expect(tasteMatch(alice, alice).percent).toBe(100);
  });

  it("is low for unrelated taste", () => {
    const bob: TasteProfile = {
      topArtistIds: ["drake", "future"],
      genreWeights: { rap: 5, trap: 4 },
      ratings: {},
    };
    expect(tasteMatch(alice, bob).percent).toBe(0);
  });

  it("ignores ratings when there are too few shared items", () => {
    const carol: TasteProfile = { ...alice, ratings: { "album:okc": 0 } };
    const m = tasteMatch(alice, carol);
    expect(m.breakdown.ratings).toBeNull();
    expect(m.percent).toBe(100);
  });

  it("lists shared artists in the first user's order", () => {
    const dan: TasteProfile = {
      topArtistIds: ["massive", "radiohead"],
      genreWeights: { "trip hop": 1 },
      ratings: {},
    };
    expect(tasteMatch(alice, dan).sharedArtistIds).toEqual(["radiohead", "massive"]);
  });
});
