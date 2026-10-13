import { describe, expect, it } from "vitest";
import { ageBracket, ageFromBirthMonth, defaultsForBracket, isValidBirthMonth } from "./age";

const NOW = new Date(Date.UTC(2026, 9, 13)); // 13 Oct 2026

describe("ageFromBirthMonth", () => {
  it("counts a birthday month as not yet passed (conservative)", () => {
    expect(ageFromBirthMonth({ year: 2013, month: 10 }, NOW)).toBe(12);
  });
  it("counts earlier months as passed", () => {
    expect(ageFromBirthMonth({ year: 2013, month: 9 }, NOW)).toBe(13);
  });
  it("counts later months as not passed", () => {
    expect(ageFromBirthMonth({ year: 2013, month: 11 }, NOW)).toBe(12);
  });
});

describe("ageBracket", () => {
  it("blocks under 13", () => {
    expect(ageBracket({ year: 2014, month: 1 }, NOW)).toBe("blocked");
    expect(ageBracket({ year: 2013, month: 10 }, NOW)).toBe("blocked");
  });
  it("marks 13–17 as teen", () => {
    expect(ageBracket({ year: 2013, month: 9 }, NOW)).toBe("teen");
    expect(ageBracket({ year: 2008, month: 10 }, NOW)).toBe("teen");
  });
  it("marks 18+ as adult", () => {
    expect(ageBracket({ year: 2008, month: 9 }, NOW)).toBe("adult");
    expect(ageBracket({ year: 1990, month: 5 }, NOW)).toBe("adult");
  });
});

describe("isValidBirthMonth", () => {
  it("rejects future dates, bad months and absurd years", () => {
    expect(isValidBirthMonth({ year: 2026, month: 11 }, NOW)).toBe(false);
    expect(isValidBirthMonth({ year: 2000, month: 13 }, NOW)).toBe(false);
    expect(isValidBirthMonth({ year: 1800, month: 1 }, NOW)).toBe(false);
  });
  it("accepts normal dates", () => {
    expect(isValidBirthMonth({ year: 2001, month: 6 }, NOW)).toBe(true);
  });
});

describe("defaultsForBracket", () => {
  it("makes teens private with explicit content hidden", () => {
    expect(defaultsForBracket("teen")).toEqual({ isPrivate: true, showExplicit: false });
  });
  it("makes adults public", () => {
    expect(defaultsForBracket("adult")).toEqual({ isPrivate: false, showExplicit: true });
  });
});
