/**
 * Text normalisation for moderation and usernames.
 *
 * This is the evasion-resistant pre-processing step. It does NOT contain a
 * slur list. Matching against the real list is done by the moderation
 * library (pending package approval) or `containsBlockedTerm` with a list
 * loaded at runtime.
 */

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

/** Common character substitutions used to dodge filters. */
const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  $: "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
  "(": "c",
};

/**
 * Lowercase, strip accents and zero-width chars, map leetspeak,
 * drop non-letters, collapse 3+ repeated letters to 2.
 */
export function normalizeForMatching(input: string): string {
  const deaccented = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(ZERO_WIDTH, "")
    .toLowerCase();

  let mapped = "";
  for (const ch of deaccented) mapped += LEET[ch] ?? ch;

  return mapped.replace(/[^a-z]/g, "").replace(/([a-z])\1{2,}/g, "$1$1");
}

/** Like normalizeForMatching, but keeps word boundaries as single spaces. */
export function normalizeWords(input: string): string[] {
  return input
    .split(/\s+/)
    .map((w) => normalizeForMatching(w))
    .filter(Boolean);
}

/**
 * Checks text against a list of blocked terms (already lowercase a–z).
 * Catches spaced-out ("b a d"), punctuated ("b.a.d"), leet ("b4d") and
 * stretched ("baaaad" -> "baad") variants.
 *
 * `wholeWordTerms` only match as complete words, to avoid the Scunthorpe problem
 * for short terms that appear inside innocent words.
 */
export function containsBlockedTerm(
  text: string,
  terms: readonly string[],
  wholeWordTerms: readonly string[] = [],
): string | null {
  const squashed = normalizeForMatching(text);
  const squashedCollapsed = squashed.replace(/([a-z])\1+/g, "$1");
  for (const t of terms) {
    const tc = t.replace(/([a-z])\1+/g, "$1");
    if (squashed.includes(t) || squashedCollapsed.includes(tc)) return t;
  }
  if (wholeWordTerms.length) {
    const words = new Set(normalizeWords(text));
    for (const joined of joinSingleLetterRuns(normalizeWords(text))) words.add(joined);
    for (const t of wholeWordTerms) if (words.has(t)) return t;
  }
  return null;
}

/** ["b","a","d","day"] -> ["bad"]: rebuilds words someone spelled out letter by letter. */
export function joinSingleLetterRuns(words: readonly string[]): string[] {
  const out: string[] = [];
  let run = "";
  for (const w of words) {
    if (w.length === 1) {
      run += w;
    } else {
      if (run.length > 1) out.push(run);
      run = "";
    }
  }
  if (run.length > 1) out.push(run);
  return out;
}
