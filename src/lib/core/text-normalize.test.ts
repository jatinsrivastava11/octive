import { describe, expect, it } from "vitest";
import {
  containsBlockedTerm,
  joinSingleLetterRuns,
  normalizeForMatching,
} from "./text-normalize";

// Tests use harmless stand-in words; the real list is loaded at runtime.
const TERMS = ["badword", "gross"];
const WHOLE = ["ass"];

describe("normalizeForMatching", () => {
  it("lowercases, maps leet, strips punctuation", () => {
    expect(normalizeForMatching("B@dW0rd!")).toBe("badwordi");
    expect(normalizeForMatching("b.a.d w-o-r-d")).toBe("badword");
  });
  it("strips accents and zero-width characters", () => {
    expect(normalizeForMatching("bádwörd")).toBe("badword");
    expect(normalizeForMatching("bad\u200Bword")).toBe("badword");
  });
  it("collapses 3+ repeats to 2", () => {
    expect(normalizeForMatching("baaaaadword")).toBe("baadword");
  });
});

describe("containsBlockedTerm", () => {
  it("catches plain, leet, spaced, stretched and punctuated variants", () => {
    for (const s of ["badword", "B4DW0RD", "b a d w o r d", "baaaadwooord", "b.a.d.w.o.r.d", "gr0ss"]) {
      expect(containsBlockedTerm(s, TERMS)).not.toBeNull();
    }
  });
  it("allows clean text", () => {
    expect(containsBlockedTerm("this album is a masterpiece", TERMS)).toBeNull();
  });
  it("matches short terms only as whole words (Scunthorpe-safe)", () => {
    expect(containsBlockedTerm("classic bass line", [], WHOLE)).toBeNull();
    expect(containsBlockedTerm("you a55", [], WHOLE)).toBe("ass");
    expect(containsBlockedTerm("a s s", [], WHOLE)).toBe("ass");
  });
});

describe("joinSingleLetterRuns", () => {
  it("joins runs of single letters only", () => {
    expect(joinSingleLetterRuns(["b", "a", "d", "day", "x", "y"])).toEqual(["bad", "xy"]);
    expect(joinSingleLetterRuns(["hello", "a", "world"])).toEqual([]);
  });
});
