import { describe, expect, it } from "vitest";
import { normalizeUsername, suggestUsername, validateUsername } from "./username";

describe("validateUsername", () => {
  it("accepts valid names", () => {
    expect(validateUsername("jatin")).toBeNull();
    expect(validateUsername("@Jatin_S.99")).toBeNull();
  });
  it("rejects each failure mode", () => {
    expect(validateUsername("ab")).toBe("too_short");
    expect(validateUsername("a".repeat(21))).toBe("too_long");
    expect(validateUsername("hi there")).toBe("bad_chars");
    expect(validateUsername(".jatin")).toBe("bad_dots");
    expect(validateUsername("ja..tin")).toBe("bad_dots");
    expect(validateUsername("settings")).toBe("reserved");
    expect(validateUsername("x_b4dword_x", ["badword"])).toBe("blocked");
  });
});

describe("normalizeUsername", () => {
  it("trims, lowercases and strips a leading @", () => {
    expect(normalizeUsername("  @Jatin ")).toBe("jatin");
  });
});

describe("suggestUsername", () => {
  it("builds a handle from a display name", () => {
    expect(suggestUsername("Jatin S.")).toBe("jatin.s");
    expect(suggestUsername("Björk Guðmundsdóttir")).toMatch(/^bjork\./);
  });
  it("pads very short names", () => {
    expect(suggestUsername("A").length).toBeGreaterThanOrEqual(3);
  });
});
