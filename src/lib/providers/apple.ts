import { flags } from "@/lib/env";
import type {
  ExternalArtist,
  ExternalTrack,
  MusicProvider,
  RecentlyPlayedResult,
  SearchResults,
} from "./types";

/**
 * Apple Music stub provider.
 * Implements the standard MusicProvider interface, guarded by NEXT_PUBLIC_ENABLE_APPLE.
 * Can be fully implemented with MusicKit JS / Apple Music API once an Apple Developer subscription is active.
 */
export class AppleMusicProvider implements MusicProvider {
  readonly providerId = "apple" as const;

  private checkEnabled() {
    if (!flags.apple) {
      throw new Error(
        "Apple Music integration is disabled in this environment. Set NEXT_PUBLIC_ENABLE_APPLE=true after configuring an Apple Developer account.",
      );
    }
  }

  async getRecentlyPlayed(): Promise<RecentlyPlayedResult> {
    this.checkEnabled();
    return { streams: [] };
  }

  async getTopTracks(): Promise<ExternalTrack[]> {
    this.checkEnabled();
    return [];
  }

  async getTopArtists(): Promise<ExternalArtist[]> {
    this.checkEnabled();
    return [];
  }

  async search(): Promise<SearchResults> {
    this.checkEnabled();
    return { tracks: [], artists: [], albums: [] };
  }
}
