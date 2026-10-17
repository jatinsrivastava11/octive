import type {
  ExternalArtist,
  ExternalStreamEvent,
  ExternalTrack,
  MusicProvider,
  RecentlyPlayedResult,
  SearchResults,
  TimeRange,
} from "./types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyTrackObject {
  id: string;
  name: string;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  preview_url: string | null;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
    release_date: string;
  };
  external_urls: { spotify: string };
}

interface SpotifyArtistObject {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string }[];
  followers?: { total: number };
  external_urls: { spotify: string };
}

function parseReleaseYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function mapTrack(item: SpotifyTrackObject): ExternalTrack {
  return {
    id: item.id,
    name: item.name,
    artistNames: item.artists.map((a) => a.name),
    artistIds: item.artists.map((a) => a.id),
    albumName: item.album.name,
    albumId: item.album.id,
    albumImageUrl: item.album.images[0]?.url,
    durationMs: item.duration_ms,
    popularity: item.popularity ?? 0,
    previewUrl: item.preview_url ?? undefined,
    releaseYear: parseReleaseYear(item.album.release_date),
    explicit: item.explicit,
    externalUrl: item.external_urls?.spotify,
  };
}

function mapArtist(item: SpotifyArtistObject): ExternalArtist {
  return {
    id: item.id,
    name: item.name,
    genres: item.genres ?? [],
    popularity: item.popularity ?? 0,
    imageUrl: item.images[0]?.url,
    followersCount: item.followers?.total,
    externalUrl: item.external_urls?.spotify,
  };
}

export class SpotifyProvider implements MusicProvider {
  readonly providerId = "spotify" as const;

  private async fetchApi<T>(accessToken: string, endpoint: string): Promise<T> {
    const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After") ?? "5";
      throw new Error(`Spotify rate limit exceeded. Retry after ${retryAfter}s`);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Spotify API error [${res.status}]: ${errBody}`);
    }

    return res.json() as Promise<T>;
  }

  async getRecentlyPlayed(accessToken: string, afterCursor?: string): Promise<RecentlyPlayedResult> {
    const url = `/me/player/recently-played?limit=50${afterCursor ? `&after=${afterCursor}` : ""}`;
    const data = await this.fetchApi<{
      items: { track: SpotifyTrackObject; played_at: string }[];
      cursors?: { after: string };
    }>(accessToken, url);

    const streams: ExternalStreamEvent[] = data.items.map((item) => ({
      track: mapTrack(item.track),
      playedAt: item.played_at,
    }));

    return {
      streams,
      nextCursor: data.cursors?.after,
    };
  }

  async getTopTracks(accessToken: string, timeRange: TimeRange = "medium_term", limit = 50): Promise<ExternalTrack[]> {
    const clampedLimit = Math.min(50, Math.max(1, limit));
    const data = await this.fetchApi<{ items: SpotifyTrackObject[] }>(
      accessToken,
      `/me/top/tracks?time_range=${timeRange}&limit=${clampedLimit}`,
    );

    return data.items.map(mapTrack);
  }

  async getTopArtists(accessToken: string, timeRange: TimeRange = "medium_term", limit = 50): Promise<ExternalArtist[]> {
    const clampedLimit = Math.min(50, Math.max(1, limit));
    const data = await this.fetchApi<{ items: SpotifyArtistObject[] }>(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=${clampedLimit}`,
    );

    return data.items.map(mapArtist);
  }

  async search(
    accessToken: string,
    query: string,
    types: ("track" | "album" | "artist")[] = ["track", "artist"],
    limit = 20,
  ): Promise<SearchResults> {
    const typesStr = encodeURIComponent(types.join(","));
    const queryStr = encodeURIComponent(query);
    const clampedLimit = Math.min(50, Math.max(1, limit));

    const data = await this.fetchApi<{
      tracks?: { items: SpotifyTrackObject[] };
      artists?: { items: SpotifyArtistObject[] };
      albums?: {
        items: {
          id: string;
          name: string;
          artists: { id: string; name: string }[];
          release_date: string;
          total_tracks: number;
          images: { url: string }[];
          external_urls: { spotify: string };
        }[];
      };
    }>(accessToken, `/search?q=${queryStr}&type=${typesStr}&limit=${clampedLimit}`);

    return {
      tracks: data.tracks?.items.map(mapTrack) ?? [],
      artists: data.artists?.items.map(mapArtist) ?? [],
      albums:
        data.albums?.items.map((album) => ({
          id: album.id,
          name: album.name,
          artistNames: album.artists.map((a) => a.name),
          artistIds: album.artists.map((a) => a.id),
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          imageUrl: album.images[0]?.url,
          externalUrl: album.external_urls?.spotify,
        })) ?? [],
    };
  }
}
