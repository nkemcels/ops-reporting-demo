/** Lowercase and strip punctuation/whitespace so "Proj. Code" matches "project_code"-style aliases. */
export function normalizeHeader(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Edit distance, used for "did you mean …?" suggestions and fuzzy header matching. */
export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Closest candidate within `maxDistance` edits (case-insensitive), or null. */
export function closestMatch(input: string, candidates: string[], maxDistance = 2): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const c of candidates) {
    const d = levenshtein(input.toUpperCase(), c.toUpperCase());
    if (d < bestDistance) {
      bestDistance = d;
      best = c;
    }
  }
  return bestDistance <= maxDistance ? best : null;
}
