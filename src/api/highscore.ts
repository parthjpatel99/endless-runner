export interface GlobalHighScore {
  score: number;
  holder: string;
}

/**
 * Returns the current world record, or `null` when the leaderboard can't be
 * reached. Callers must treat `null` as "unknown", never as a record of 0 —
 * otherwise every run looks like a new world record while the API is down.
 */
export async function fetchGlobalHighScore(): Promise<GlobalHighScore | null> {
  try {
    const res = await fetch('/api/highscore');
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<GlobalHighScore>;
    if (typeof data.score !== 'number' || !Number.isFinite(data.score)) return null;
    return { score: data.score, holder: typeof data.holder === 'string' ? data.holder : '' };
  } catch {
    return null;
  }
}

/** A run only counts as a world record against a *known* record — `null` (unknown) never does. */
export function isWorldRecord(score: number, record: GlobalHighScore | null): boolean {
  return record !== null && score > 0 && score > record.score;
}

export async function submitHighScore(score: number, name: string): Promise<boolean> {
  try {
    const res = await fetch('/api/highscore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, name }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean; isNewRecord: boolean };
    return data.isNewRecord;
  } catch {
    return false;
  }
}
