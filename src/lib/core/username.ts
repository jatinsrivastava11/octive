import { containsBlockedTerm } from "./text-normalize";

/**
 * Usernames: 3–20 chars, lowercase letters, digits, "_" and ".".
 * Can't start/end with "." or contain "..". Reserved route names are blocked.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "app", "auth", "callback", "diary", "explore",
  "feed", "help", "home", "login", "logout", "me", "new", "octive", "onboarding",
  "privacy", "profile", "rankings", "root", "settings", "share", "signin", "signout",
  "signup", "support", "system", "terms", "u", "user", "users", "www",
]);

export type UsernameError = "too_short" | "too_long" | "bad_chars" | "bad_dots" | "reserved" | "blocked";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function validateUsername(
  raw: string,
  blockedTerms: readonly string[] = [],
): UsernameError | null {
  const u = normalizeUsername(raw);
  if (u.length < USERNAME_MIN) return "too_short";
  if (u.length > USERNAME_MAX) return "too_long";
  if (!/^[a-z0-9._]+$/.test(u)) return "bad_chars";
  if (u.startsWith(".") || u.endsWith(".") || u.includes("..")) return "bad_dots";
  if (RESERVED_USERNAMES.has(u)) return "reserved";
  if (blockedTerms.length && containsBlockedTerm(u, blockedTerms)) return "blocked";
  return null;
}

/** Suggests a username from a display name, e.g. "Jatin S." -> "jatin.s". */
export function suggestUsername(displayName: string): string {
  const base = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, USERNAME_MAX);
  return base.length >= USERNAME_MIN ? base : `listener${base}`.slice(0, USERNAME_MAX);
}
