import { describe, expect, it } from "vitest";
import { calculateRarity, generateCards, type UserStatsSnapshot } from "./cards";

describe("calculateRarity", () => {
  const baseStats: UserStatsSnapshot = {
    topArtist: { name: "Radiohead", plays: 150, percentOfTotal: 10 },
    dominantGenre: { name: "art rock", percent: 20 },
    nightListeningPercent: 10,
    obscurityScore: 30,
    favoriteDecade: { decade: "2010s", percent: 25 },
    weeklyStreak: 2,
    weeklyPlayCount: 150,
  };

  it("calculates top artist rarity based on listening share", () => {
    expect(calculateRarity("top_artist", { ...baseStats, topArtist: { name: "R", plays: 200, percentOfTotal: 10 } })).toBe("common");
    expect(calculateRarity("top_artist", { ...baseStats, topArtist: { name: "R", plays: 200, percentOfTotal: 18 } })).toBe("rare");
    expect(calculateRarity("top_artist", { ...baseStats, topArtist: { name: "R", plays: 200, percentOfTotal: 28 } })).toBe("epic");
    expect(calculateRarity("top_artist", { ...baseStats, topArtist: { name: "R", plays: 200, percentOfTotal: 45 } })).toBe("legendary");
  });

  it("rewards deep underground listening with legendary obscurity", () => {
    expect(calculateRarity("obscurity", { ...baseStats, obscurityScore: 30 })).toBe("common");
    expect(calculateRarity("obscurity", { ...baseStats, obscurityScore: 48 })).toBe("rare");
    expect(calculateRarity("obscurity", { ...baseStats, obscurityScore: 65 })).toBe("epic");
    expect(calculateRarity("obscurity", { ...baseStats, obscurityScore: 82 })).toBe("legendary");
  });

  it("identifies nocturnal listening patterns", () => {
    expect(calculateRarity("night_owl", { ...baseStats, nightListeningPercent: 28 })).toBe("rare");
    expect(calculateRarity("night_owl", { ...baseStats, nightListeningPercent: 65 })).toBe("legendary");
  });

  it("weights vintage decade immersion higher", () => {
    expect(calculateRarity("decade_diver", { ...baseStats, favoriteDecade: { decade: "1970s", percent: 42 } })).toBe("legendary");
    expect(calculateRarity("decade_diver", { ...baseStats, favoriteDecade: { decade: "2020s", percent: 42 } })).toBe("epic");
  });
});

describe("generateCards", () => {
  it("generates a card set matching user stats snapshot", () => {
    const stats: UserStatsSnapshot = {
      topArtist: { name: "Massive Attack", plays: 320, percentOfTotal: 42 },
      dominantGenre: { name: "trip hop", percent: 48 },
      nightListeningPercent: 62,
      obscurityScore: 78,
      favoriteDecade: { decade: "1990s", percent: 55 },
      weeklyStreak: 15,
      weeklyPlayCount: 450,
    };

    const cards = generateCards(stats);
    expect(cards.length).toBeGreaterThanOrEqual(5);

    const artistCard = cards.find((c) => c.category === "top_artist");
    expect(artistCard).toBeDefined();
    expect(artistCard?.rarity).toBe("legendary");
    expect(artistCard?.title).toBe("Massive Attack");

    const nightCard = cards.find((c) => c.category === "night_owl");
    expect(nightCard).toBeDefined();
    expect(nightCard?.rarity).toBe("legendary");
  });

  it("handles sparse stats gracefully", () => {
    const emptyStats: UserStatsSnapshot = {
      topArtist: null,
      dominantGenre: null,
      nightListeningPercent: 5,
      obscurityScore: 10,
      favoriteDecade: null,
      weeklyStreak: 0,
      weeklyPlayCount: 10,
    };

    const cards = generateCards(emptyStats);
    expect(cards).toHaveLength(0);
  });
});
