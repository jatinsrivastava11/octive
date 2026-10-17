/**
 * Multi-provider music interface for Octive.
 * Decouples Spotify / Apple Music / future services from the core domain.
 */

export interface ExternalTrack {
  id: string;
  name: string;
  artistNames: string[];
  artistIds: string[];
  albumName: string;
  albumId: string;
  albumImageUrl?: string;
  durationMs: number;
  popularity: number;
  previewUrl?: string;
  releaseYear: number | null;
  explicit: boolean;
  externalUrl?: string;
}

export interface ExternalArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl?: string;
  followersCount?: number;
  externalUrl?: string;
}

export interface ExternalAlbum {
  id: string;
  name: string;
  artistNames: string[];
  artistIds: string[];
  releaseDate?: string;
  totalTracks: number;
  imageUrl?: string;
  genres?: string[];
  externalUrl?: string;
}

export interface ExternalStreamEvent {
  track: ExternalTrack;
  playedAt: string; // ISO 8601
}

export interface RecentlyPlayedResult {
  streams: ExternalStreamEvent[];
  nextCursor?: string;
}

export interface SearchResults {
  tracks: ExternalTrack[];
  artists: ExternalArtist[];
  albums: ExternalAlbum[];
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface MusicProvider {
  readonly providerId: "spotify" | "apple";

  getRecentlyPlayed(accessToken: string, afterCursor?: string): Promise<RecentlyPlayedResult>;
  getTopTracks(accessToken: string, timeRange?: TimeRange, limit?: number): Promise<ExternalTrack[]>;
  getTopArtists(accessToken: string, timeRange?: TimeRange, limit?: number): Promise<ExternalArtist[]>;
  search(accessToken: string, query: string, types?: ("track" | "album" | "artist")[], limit?: number): Promise<SearchResults>;
}
