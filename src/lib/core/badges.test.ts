import { describe, expect, it } from "vitest";
import { checkBadgeUnlocked, evaluateAllBadges, type BadgeEvaluationContext } from "./badges";

describe("checkBadgeUnlocked", () => {
  it("unlocks early_listener only when artist popularity is under 30", () => {
    expect(checkBadgeUnlocked("early_listener", { lowestArtistPopularitySeen: 45 })).toBe(false);
    expect(checkBadgeUnlocked("early_listener", { lowestArtistPopularitySeen: 25 })).toBe(true);
  });

  it("unlocks genre_hopper for 15+ genres", () => {
    expect(checkBadgeUnlocked("genre_hopper", { distinctGenresCount: 14 })).toBe(false);
    expect(checkBadgeUnlocked("genre_hopper", { distinctGenresCount: 15 })).toBe(true);
    expect(checkBadgeUnlocked("genre_hopper", { distinctGenresCount: 22 })).toBe(true);
  });

  it("unlocks certified_ear when 3+ items have 90+ Octive rating", () => {
    expect(checkBadgeUnlocked("certified_ear", { certifiedRatingsCount: 2 })).toBe(false);
    expect(checkBadgeUnlocked("certified_ear", { certifiedRatingsCount: 3 })).toBe(true);
  });

  it("unlocks taste_twin at 85% taste match", () => {
    expect(checkBadgeUnlocked("taste_twin", { highestTasteMatchPercent: 84 })).toBe(false);
    expect(checkBadgeUnlocked("taste_twin", { highestTasteMatchPercent: 85 })).toBe(true);
  });
});

describe("evaluateAllBadges", () => {
  it("returns all matching badges in a batch evaluation", () => {
    const ctx: BadgeEvaluationContext = {
      lowestArtistPopularitySeen: 15,
      distinctGenresCount: 18,
      weeklyStreamCount: 150,
      certifiedRatingsCount: 4,
    };

    const unlocked = evaluateAllBadges(ctx);
    expect(unlocked).toContain("early_listener");
    expect(unlocked).toContain("genre_hopper");
    expect(unlocked).toContain("centurion");
    expect(unlocked).toContain("certified_ear");
    expect(unlocked).not.toContain("taste_twin");
  });
});
