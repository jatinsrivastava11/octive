import { AppleMusicProvider } from "./apple";
import { SpotifyProvider } from "./spotify";
import type { MusicProvider } from "./types";

export * from "./types";
export { AppleMusicProvider } from "./apple";
export { SpotifyProvider } from "./spotify";

const spotify = new SpotifyProvider();
const apple = new AppleMusicProvider();

export function getMusicProvider(providerId: "spotify" | "apple"): MusicProvider {
  switch (providerId) {
    case "spotify":
      return spotify;
    case "apple":
      return apple;
    default:
      throw new Error(`Unknown music provider: ${providerId}`);
  }
}
