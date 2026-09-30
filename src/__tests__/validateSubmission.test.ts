import { describe, it, expect } from 'vitest';
import { MAX_SCORE, validateSubmission } from '../../api/_validate';

describe('validateSubmission (server-side)', () => {
  it('accepts a valid submission and trims the name', () => {
    expect(validateSubmission({ score: 420, name: '  alice ' })).toEqual({ score: 420, name: 'alice' });
  });

  it('rejects a missing or non-object body', () => {
    expect(validateSubmission(undefined)).toEqual({ error: 'Invalid score' });
    expect(validateSubmission('nope')).toEqual({ error: 'Invalid score' });
  });

  it('rejects non-integer, zero and negative scores', () => {
    for (const score of [1.5, 0, -3, '100', NaN]) {
      expect(validateSubmission({ score, name: 'alice' })).toEqual({ error: 'Invalid score' });
    }
  });

  it('rejects scores above the cap', () => {
    expect(validateSubmission({ score: MAX_SCORE + 1, name: 'alice' })).toEqual({ error: 'Score exceeds maximum' });
    expect(validateSubmission({ score: MAX_SCORE, name: 'alice' })).toEqual({ score: MAX_SCORE, name: 'alice' });
  });

  it('rejects empty, long and non-alphanumeric names', () => {
    expect(validateSubmission({ score: 5, name: '   ' })).toEqual({ error: 'Name must be 1-20 characters' });
    expect(validateSubmission({ score: 5, name: 'x'.repeat(21) })).toEqual({ error: 'Name must be 1-20 characters' });
    expect(validateSubmission({ score: 5, name: '<script>' })).toEqual({ error: 'Name must be alphanumeric' });
  });
});
