import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGlobalHighScore, isWorldRecord, submitHighScore } from '../api/highscore';

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

  it('returns null (unknown) on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchGlobalHighScore();
    expect(result).toBeNull();
  });

  it('returns null (unknown) when the API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    } as Response);

    expect(await fetchGlobalHighScore()).toBeNull();
  });

  it('returns null for a malformed payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'nope' }),
    } as Response);

    expect(await fetchGlobalHighScore()).toBeNull();
  });

  it('returns an empty record when nobody has set one yet', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ score: 0, holder: '' }),
    } as Response);

    expect(await fetchGlobalHighScore()).toEqual({ score: 0, holder: '' });
  });
});

describe('isWorldRecord', () => {
  it('is never true against an unknown record', () => {
    expect(isWorldRecord(9999, null)).toBe(false);
  });

  it('requires beating the current record', () => {
    expect(isWorldRecord(500, { score: 500, holder: 'alice' })).toBe(false);
    expect(isWorldRecord(501, { score: 500, holder: 'alice' })).toBe(true);
  });

  it('counts any positive score against an empty leaderboard', () => {
    expect(isWorldRecord(1, { score: 0, holder: '' })).toBe(true);
    expect(isWorldRecord(0, { score: 0, holder: '' })).toBe(false);
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
