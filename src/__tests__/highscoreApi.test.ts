import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGlobalHighScore, submitHighScore } from '../api/highscore';

describe('fetchGlobalHighScore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns score and holder on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ score: 500, holder: 'alice' }),
    } as Response);

    const result = await fetchGlobalHighScore();
    expect(result).toEqual({ score: 500, holder: 'alice' });
  });

  it('returns zeroed record on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchGlobalHighScore();
    expect(result).toEqual({ score: 0, holder: '' });
  });
});

describe('submitHighScore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when server confirms new record', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, isNewRecord: true }),
    } as Response);

    const result = await submitHighScore(500, 'alice');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/highscore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 500, name: 'alice' }),
    });
  });

  it('returns false when score is not a new record', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, isNewRecord: false }),
    } as Response);

    const result = await submitHighScore(100, 'bob');
    expect(result).toBe(false);
  });

  it('returns false on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await submitHighScore(500, 'alice');
    expect(result).toBe(false);
  });
});
