// Leading underscore: Vercel does not turn this file into a function.
export const MAX_SCORE = 10000;
export const MAX_NAME_LENGTH = 20;
const NAME_PATTERN = /^[a-zA-Z0-9 ]+$/;

export type Submission = { score: number; name: string };

/** Validates a POST body. Returns the clean submission, or an error message for a 400. */
export function validateSubmission(body: unknown): Submission | { error: string } {
  const { score, name } = (body && typeof body === 'object' ? body : {}) as { score?: unknown; name?: unknown };

  if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
    return { error: 'Invalid score' };
  }
  if (score > MAX_SCORE) {
    return { error: 'Score exceeds maximum' };
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length === 0 || trimmedName.length > MAX_NAME_LENGTH) {
    return { error: 'Name must be 1-20 characters' };
  }
  if (!NAME_PATTERN.test(trimmedName)) {
    return { error: 'Name must be alphanumeric' };
  }

  return { score, name: trimmedName };
}
