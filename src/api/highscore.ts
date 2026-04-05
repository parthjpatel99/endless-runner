export interface GlobalHighScore {
  score: number;
  holder: string;
}

export async function fetchGlobalHighScore(): Promise<GlobalHighScore> {
  try {
    const res = await fetch('/api/highscore');
    if (!res.ok) return { score: 0, holder: '' };
    return (await res.json()) as GlobalHighScore;
  } catch {
    return { score: 0, holder: '' };
  }
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
