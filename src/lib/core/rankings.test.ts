import { describe, expect, it } from "vitest";
import {
  communityScore,
  moveItem,
  orderInconsistencies,
  PRIOR_MEAN,
  validateRanking,
  type RankingItem,
} from "./rankings";

const item = (id: string, score: number, kind: RankingItem["kind"] = "album"): RankingItem => ({
  itemId: id,
  kind,
  score,
});

describe("moveItem", () => {
  it("moves down", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("moves up", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("clamps target and ignores bad source", () => {
    expect(moveItem(["a", "b"], 0, 99)).toEqual(["b", "a"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
  it("does not mutate input", () => {
    const src = ["a", "b"];
    moveItem(src, 0, 1);
    expect(src).toEqual(["a", "b"]);
  });
});

describe("validateRanking", () => {
  it("accepts a valid ranking", () => {
    expect(validateRanking("Best of 2026", [item("x", 9), item("y", 8.5)])).toBeNull();
  });
  it("catches each error", () => {
    expect(validateRanking("  ", [item("x", 9)])).toBe("bad_title");
    expect(validateRanking("t", [])).toBe("empty");
    expect(validateRanking("t", [item("x", 9), item("x", 8)])).toBe("duplicate_item");
    expect(validateRanking("t", [item("x", 9), item("y", 8, "track")])).toBe("mixed_kinds");
    expect(validateRanking("t", [item("x", 9.3)])).toBe("invalid_score");
    expect(validateRanking("t", Array.from({ length: 101 }, (_, i) => item(`i${i}`, 5)))).toBe("too_many");
  });
});

describe("communityScore", () => {
  it("falls back to the prior with no votes", () => {
    expect(communityScore([])).toEqual({ mean: null, weighted: PRIOR_MEAN, count: 0 });
  });
  it("pulls a single 10 toward the prior", () => {
    const r = communityScore([10]);
    expect(r.mean).toBe(10);
    expect(r.weighted).toBe(7);
  });
  it("converges to the mean with many votes", () => {
    const r = communityScore(Array.from({ length: 200 }, () => 9));
    expect(r.weighted).toBeGreaterThan(8.9);
  });
});

describe("orderInconsistencies", () => {
  it("flags items scored higher than the one ranked above", () => {
    expect(orderInconsistencies([item("a", 9), item("b", 9.5), item("c", 7)])).toEqual([1]);
  });
});
