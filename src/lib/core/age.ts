/**
 * Age gate.
 *
 * We store only birth year + month (data minimisation). Since the day is
 * unknown, we are conservative: a user is treated as NOT yet having had
 * their birthday during their birth month.
 */

export const MIN_AGE = 13;
export const ADULT_AGE = 18;

export type AgeBracket = "blocked" | "teen" | "adult";

export interface BirthMonth {
  year: number;
  /** 1–12 */
  month: number;
}

export function isValidBirthMonth(b: BirthMonth, now: Date = new Date()): boolean {
  const thisYear = now.getUTCFullYear();
  return (
    Number.isInteger(b.year) &&
    Number.isInteger(b.month) &&
    b.month >= 1 &&
    b.month <= 12 &&
    b.year >= thisYear - 120 &&
    (b.year < thisYear || (b.year === thisYear && b.month <= now.getUTCMonth() + 1))
  );
}

/** Conservative age in whole years. */
export function ageFromBirthMonth(b: BirthMonth, now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  let age = y - b.year;
  if (m <= b.month) age -= 1;
  return Math.max(0, age);
}

export function ageBracket(b: BirthMonth, now: Date = new Date()): AgeBracket {
  const age = ageFromBirthMonth(b, now);
  if (age < MIN_AGE) return "blocked";
  if (age < ADULT_AGE) return "teen";
  return "adult";
}

/** Defaults applied at onboarding based on bracket. */
export function defaultsForBracket(bracket: Exclude<AgeBracket, "blocked">) {
  return bracket === "teen"
    ? { isPrivate: true, showExplicit: false }
    : { isPrivate: false, showExplicit: true };
}
