import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppleMusicProvider, SpotifyProvider } from "./index";

describe("SpotifyProvider", () => {
  const provider = new SpotifyProvider();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("maps recently played tracks accurately", async () => {
    const mockSpotifyResponse = {
      items: [
        {
          played_at: "2026-10-15T12:00:00.000Z",
          track: {
            id: "track-1",
            name: "Karma Police",
            duration_ms: 261000,
            popularity: 75,
            explicit: false,
            artists: [{ id: "artist-1", name: "Radiohead" }],
            album: {
              id: "album-1",
              name: "OK Computer",
              images: [{ url: "https://example.com/cover.jpg" }],
              release_date: "1997-05-21",
            },
            external_urls: { spotify: "https://open.spotify.com/track/1" },
          },
        },
      ],
      cursors: { after: "1697371200000" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSpotifyResponse,
    } as unknown as Response);

    const res = await provider.getRecentlyPlayed("mock-token", "cursor-1");
    expect(res.streams).toHaveLength(1);
    expect(res.streams[0]?.track.name).toBe("Karma Police");
    expect(res.streams[0]?.track.releaseYear).toBe(1997);
    expect(res.streams[0]?.track.artistNames).toEqual(["Radiohead"]);
    expect(res.nextCursor).toBe("1697371200000");
  });

  it("throws with descriptive message on 429 rate limit", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "10" }),
      text: async () => "Rate limit exceeded",
    } as unknown as Response);

    await expect(provider.getTopTracks("mock-token")).rejects.toThrow("Spotify rate limit exceeded. Retry after 10s");
  });
});

describe("AppleMusicProvider", () => {
  const apple = new AppleMusicProvider();

  it("throws when feature flag is disabled", async () => {
    await expect(apple.getRecentlyPlayed()).rejects.toThrow("Apple Music integration is disabled");
  });
});
