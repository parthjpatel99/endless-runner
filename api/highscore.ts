import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const MAX_SCORE = 10000;
const MAX_NAME_LENGTH = 20;
const NAME_PATTERN = /^[a-zA-Z0-9 ]+$/;

interface HighScore {
  score: number;
  holder: string;
}

async function getHighScore(): Promise<HighScore> {
  const data = await redis.hgetall<Record<string, string>>('highscore');
  if (!data || data['score'] === undefined) {
    return { score: 0, holder: '' };
  }
  return { score: Number(data['score']), holder: String(data['holder']) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const record = await getHighScore();
      return res.status(200).json(record);
    }

    if (req.method === 'POST') {
      const { score, name } = req.body as { score: unknown; name: unknown };

      if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
        return res.status(400).json({ error: 'Invalid score' });
      }
      if (score > MAX_SCORE) {
        return res.status(400).json({ error: 'Score exceeds maximum' });
      }

      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (trimmedName.length === 0 || trimmedName.length > MAX_NAME_LENGTH) {
        return res.status(400).json({ error: 'Name must be 1-20 characters' });
      }
      if (!NAME_PATTERN.test(trimmedName)) {
        return res.status(400).json({ error: 'Name must be alphanumeric' });
      }

      const script = `
        local current = tonumber(redis.call('HGET', KEYS[1], 'score')) or 0
        if tonumber(ARGV[1]) > current then
          redis.call('HSET', KEYS[1], 'score', ARGV[1], 'holder', ARGV[2])
          return 1
        end
        return 0
      `;
      const result = await redis.eval(script, ['highscore'], [score, trimmedName]);

      return res.status(200).json({
        success: result === 1,
        isNewRecord: result === 1,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Highscore API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
