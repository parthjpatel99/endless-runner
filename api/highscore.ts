import { Redis } from '@upstash/redis';
import { validateSubmission } from './_validate.js';

// Vercel's Upstash integration injects KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface HighScore {
  score: number;
  holder: string;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function unavailable(): Response {
  console.error('Highscore API: Redis is not configured (set KV_REST_API_URL / KV_REST_API_TOKEN)');
  return json({ error: 'Leaderboard unavailable' }, 503);
}

async function getHighScore(client: Redis): Promise<HighScore> {
  const data = await client.hgetall<Record<string, string>>('highscore');
  if (!data || data['score'] === undefined) {
    return { score: 0, holder: '' };
  }
  return { score: Number(data['score']), holder: String(data['holder']) };
}

// Atomically replace the record only if the new score is higher
const SET_IF_HIGHER = `
  local current = tonumber(redis.call('HGET', KEYS[1], 'score')) or 0
  if tonumber(ARGV[1]) > current then
    redis.call('HSET', KEYS[1], 'score', ARGV[1], 'holder', ARGV[2])
    return 1
  end
  return 0
`;

export function OPTIONS(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(): Promise<Response> {
  if (!redis) return unavailable();
  try {
    return json(await getHighScore(redis));
  } catch (err) {
    console.error('Highscore API error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!redis) return unavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }

  const submission = validateSubmission(body);
  if ('error' in submission) {
    return json({ error: submission.error }, 400);
  }

  try {
    const result = await redis.eval(SET_IF_HIGHER, ['highscore'], [submission.score, submission.name]);
    return json({ success: result === 1, isNewRecord: result === 1 });
  } catch (err) {
    console.error('Highscore API error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
}
