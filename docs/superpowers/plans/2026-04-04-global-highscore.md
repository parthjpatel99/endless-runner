# Global High Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global all-time high score system backed by Upstash Redis, so players compete for #1 and the record holder gets a coffee invitation.

**Architecture:** A Vercel serverless function at `/api/highscore.ts` handles GET (fetch record) and POST (submit new record) using Upstash Redis. The game client fetches the global record on scene load and submits new records from the GameOverScene. An HTML overlay handles name input since Excalibur has no native text input.

**Tech Stack:** Upstash Redis (`@upstash/redis`), Vercel serverless functions (`@vercel/node`), TypeScript, Excalibur.js

---

### Task 1: Install Upstash Redis via Vercel Marketplace and pull env vars

**Files:**
- Modify: `package.json` (add `@upstash/redis`)

- [ ] **Step 1: Add Upstash Redis integration via Vercel Marketplace**

```bash
vercel integration add upstash
```

Follow the interactive prompts to create a Redis database for the `salvador` project. This auto-provisions `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables.

- [ ] **Step 2: Pull environment variables locally**

```bash
vercel env pull .env.local
```

- [ ] **Step 3: Verify env vars exist**

```bash
grep KV_REST_API .env.local
```

Expected: Two lines with `KV_REST_API_URL=...` and `KV_REST_API_TOKEN=...`

- [ ] **Step 4: Install @upstash/redis**

```bash
npm install @upstash/redis
```

- [ ] **Step 5: Install @vercel/node for API function types**

```bash
npm install -D @vercel/node
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @upstash/redis and @vercel/node dependencies"
```

---

### Task 2: Create the highscore API serverless function

**Files:**
- Create: `api/highscore.ts`

- [ ] **Step 1: Create the API function**

Create `api/highscore.ts` with GET and POST handlers:

```typescript
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
  const data = await redis.hgetall<HighScore>('highscore');
  if (!data || data.score === undefined) {
    return { score: 0, holder: '' };
  }
  return { score: Number(data.score), holder: String(data.holder) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for cross-origin requests from game domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const record = await getHighScore();
    return res.status(200).json(record);
  }

  if (req.method === 'POST') {
    const { score, name } = req.body as { score: unknown; name: unknown };

    // Validate score
    if (typeof score !== 'number' || !Number.isInteger(score) || score <= 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    if (score > MAX_SCORE) {
      return res.status(400).json({ error: 'Score exceeds maximum' });
    }

    // Validate name
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName.length === 0 || trimmedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: 'Name must be 1-20 characters' });
    }
    if (!NAME_PATTERN.test(trimmedName)) {
      return res.status(400).json({ error: 'Name must be alphanumeric' });
    }

    // Atomic compare-and-set: only update if submitted score beats current
    const current = await getHighScore();
    if (score <= current.score) {
      return res.status(200).json({ success: false, isNewRecord: false });
    }

    // Use a Lua script for atomic compare-and-set
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
}
```

- [ ] **Step 2: Verify the function compiles**

The API function lives outside `src/` and is compiled by Vercel's build system independently from the Vite build. Verify it has no syntax errors:

```bash
npx tsc --noEmit --esModuleInterop --module ESNext --moduleResolution bundler --target ES2023 --strict api/highscore.ts --skipLibCheck
```

Expected: No output (clean compilation).

- [ ] **Step 3: Commit**

```bash
git add api/highscore.ts
git commit -m "feat: add /api/highscore serverless function with Upstash Redis"
```

---

### Task 3: Add global highscore config constants

**Files:**
- Modify: `src/config.ts:31` (add constants after `scorePerSecond`)

- [ ] **Step 1: Add constants to config.ts**

Add the following after the `scorePerSecond: 10,` line (line 31):

```typescript
  maxSubmittableScore: 10000,
  globalRecordColor: '#ffd60a',
  coffeeMessage: "You're #1! Email me at parth8199@gmail.com to claim a coffee",
```

- [ ] **Step 2: Run existing tests to confirm no breakage**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat: add global highscore config constants"
```

---

### Task 4: Add global highscore API client module

**Files:**
- Create: `src/api/highscore.ts`

- [ ] **Step 1: Write failing test for the API client**

Create `src/__tests__/highscoreApi.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/highscoreApi.test.ts
```

Expected: FAIL — cannot find module `../api/highscore`.

- [ ] **Step 3: Implement the API client**

Create `src/api/highscore.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/__tests__/highscoreApi.test.ts
```

Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/highscore.ts src/__tests__/highscoreApi.test.ts
git commit -m "feat: add global highscore API client with tests"
```

---

### Task 5: Display global record in GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add import and properties**

Add the import at the top of `src/scenes/GameScene.ts` (after line 8):

```typescript
import { fetchGlobalHighScore } from '../api/highscore';
import type { GlobalHighScore } from '../api/highscore';
```

Add a new static property after line 11 (`static lastScore = 0;`):

```typescript
  static globalRecord: GlobalHighScore = { score: 0, holder: '' };
```

Add a new instance property after line 20 (`private bestScoreLabel!: Label;`):

```typescript
  private worldRecordLabel!: Label;
```

- [ ] **Step 2: Add world record label in setupUI**

Add the following after the `this.add(this.bestScoreLabel);` block (after line 102):

```typescript
    this.worldRecordLabel = new Label({
      text: 'WORLD RECORD  ---',
      pos: vec(CONFIG.width - 16, 48),
      font: new Font({
        size: 12,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Right,
      }),
      z: 10,
    });
    this.add(this.worldRecordLabel);
```

- [ ] **Step 3: Fetch global record on scene activate**

Add the following at the end of the `onActivate` method (before the closing `}` at line 148), after the camera reset block:

```typescript
    // Fetch global high score (non-blocking)
    fetchGlobalHighScore().then((record) => {
      GameScene.globalRecord = record;
      if (this.worldRecordLabel) {
        this.worldRecordLabel.text = record.score > 0
          ? `WORLD RECORD  ${record.score} by ${record.holder}`
          : 'WORLD RECORD  ---';
      }
    });
```

- [ ] **Step 4: Run all tests to confirm no breakage**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: display global world record in GameScene"
```

---

### Task 6: Add name input HTML overlay

**Files:**
- Create: `src/ui/NameInputOverlay.ts`

- [ ] **Step 1: Write the overlay module**

Create `src/ui/NameInputOverlay.ts`. This creates an HTML overlay positioned over the canvas for text input (Excalibur has no native text input):

```typescript
export function showNameInput(): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'name-input-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; background: rgba(0,0,0,0.5);
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #0a0a1e; border: 2px solid #ffd60a; border-radius: 8px;
      padding: 24px; text-align: center; font-family: "Orbitron", monospace;
    `;

    const label = document.createElement('div');
    label.textContent = 'Enter your name:';
    label.style.cssText = 'color: #ffd60a; font-size: 16px; margin-bottom: 12px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Anonymous';
    input.style.cssText = `
      background: #111; color: #00f5d4; border: 1px solid #00f5d4; border-radius: 4px;
      padding: 8px 12px; font-size: 16px; font-family: "Orbitron", monospace;
      text-align: center; outline: none; width: 200px;
    `;

    const btn = document.createElement('button');
    btn.textContent = 'SUBMIT';
    btn.style.cssText = `
      display: block; margin: 12px auto 0; background: #ffd60a; color: #0a0a1e;
      border: none; border-radius: 4px; padding: 8px 24px; font-size: 14px;
      font-family: "Orbitron", monospace; font-weight: bold; cursor: pointer;
    `;

    function submit() {
      const name = input.value.trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'Anonymous';
      overlay.remove();
      resolve(name);
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      e.stopPropagation(); // prevent game from capturing keystrokes
    });
    // Prevent all key events from reaching the game canvas
    overlay.addEventListener('keydown', (e) => e.stopPropagation());
    overlay.addEventListener('keyup', (e) => e.stopPropagation());

    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/NameInputOverlay.ts
git commit -m "feat: add HTML name input overlay for world record submission"
```

---

### Task 7: Update GameOverScene with global record flow and coffee banner

**Files:**
- Modify: `src/scenes/GameOverScene.ts`

This is the biggest change. The GameOverScene needs to:
1. Show the global record alongside personal best
2. Detect if the player beat the global record
3. Show name input and submit to API
4. Display the coffee banner for #1

- [ ] **Step 1: Replace the full GameOverScene**

Replace the contents of `src/scenes/GameOverScene.ts` with:

```typescript
import { Scene, Engine, Color, vec, Font, Label, Keys, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { GameScene } from './GameScene';
import { submitHighScore } from '../api/highscore';
import { showNameInput } from '../ui/NameInputOverlay';

export class GameOverScene extends Scene {
  private scoreLabel!: Label;
  private bestScoreLabel!: Label;
  private newBestLabel!: Label;
  private blinkTimer = 0;
  private promptLabel!: Label;
  private worldRecordLabel!: Label;
  private newRecordLabel!: Label;
  private coffeeLabel!: Label;
  private coffeeLabelLine2!: Label;
  private canRestart = false;

  onInitialize(_engine: Engine) {
    // GAME OVER title
    const titleLabel = new Label({
      text: 'GAME OVER',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 80),
      font: new Font({
        size: 52,
        bold: true,
        color: Color.fromHex(CONFIG.gameOverColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(titleLabel);

    // Divider label (decorative)
    const divLabel = new Label({
      text: '────────────────────',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 42),
      font: new Font({
        size: 12,
        color: Color.fromHex('#1e1e3e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(divLabel);

    // Score label
    this.scoreLabel = new Label({
      text: 'SCORE  0',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 10),
      font: new Font({
        size: 28,
        bold: true,
        color: Color.White,
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.scoreLabel);

    // Best score label
    this.bestScoreLabel = new Label({
      text: 'BEST  0',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 30),
      font: new Font({
        size: 16,
        color: Color.fromHex('#2a8a7e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.bestScoreLabel);

    // New best badge (hidden by default)
    this.newBestLabel = new Label({
      text: '★  NEW BEST  ★',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 55),
      font: new Font({
        size: 13,
        bold: true,
        color: Color.fromHex('#ffd60a'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.newBestLabel.graphics.opacity = 0;
    this.add(this.newBestLabel);

    // World record display
    this.worldRecordLabel = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 75),
      font: new Font({
        size: 12,
        color: Color.fromHex('#2a8a7e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.worldRecordLabel);

    // NEW WORLD RECORD banner (hidden by default)
    this.newRecordLabel = new Label({
      text: '★  NEW WORLD RECORD  ★',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 55),
      font: new Font({
        size: 16,
        bold: true,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.newRecordLabel.graphics.opacity = 0;
    this.add(this.newRecordLabel);

    // Coffee banner line 1 (hidden by default)
    this.coffeeLabel = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 95),
      font: new Font({
        size: 11,
        bold: true,
        color: Color.White,
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.coffeeLabel.graphics.opacity = 0;
    this.add(this.coffeeLabel);

    // Coffee banner line 2 — email address
    this.coffeeLabelLine2 = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 112),
      font: new Font({
        size: 11,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.coffeeLabelLine2.graphics.opacity = 0;
    this.add(this.coffeeLabelLine2);

    // Restart prompt
    this.promptLabel = new Label({
      text: 'PRESS  SPACE  TO  RESTART',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 140),
      font: new Font({
        size: 14,
        color: Color.fromHex('#00f5d4'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.promptLabel);
  }

  onActivate(_ctx: SceneActivationContext) {
    const lastScore = GameScene.lastScore;
    const prevBest = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
    const isNewBest = lastScore > prevBest;

    if (isNewBest) {
      localStorage.setItem('neonRunnerBest', String(lastScore));
    }

    const displayBest = Math.max(lastScore, prevBest);
    const globalRecord = GameScene.globalRecord;
    const isNewWorldRecord = lastScore > globalRecord.score;

    // Update labels
    this.scoreLabel.text = `SCORE  ${lastScore}`;
    this.bestScoreLabel.text = `BEST  ${displayBest}`;

    // Reset all optional labels
    this.newBestLabel.graphics.opacity = 0;
    this.newRecordLabel.graphics.opacity = 0;
    this.coffeeLabel.graphics.opacity = 0;
    this.coffeeLabelLine2.graphics.opacity = 0;
    this.canRestart = true;

    if (isNewWorldRecord) {
      // Show new world record badge (replaces new best badge)
      this.newRecordLabel.graphics.opacity = 1;
      this.worldRecordLabel.text = '';

      // Block restart while name input is showing
      this.canRestart = false;

      // Show name input, submit, then show coffee banner
      showNameInput().then((name) => {
        submitHighScore(lastScore, name).then((confirmed) => {
          if (confirmed) {
            this.coffeeLabel.text = "You're #1! Email me to claim a coffee:";
            this.coffeeLabelLine2.text = 'parth8199@gmail.com';
            this.coffeeLabel.graphics.opacity = 1;
            this.coffeeLabelLine2.graphics.opacity = 1;
            // Update the cached global record
            GameScene.globalRecord = { score: lastScore, holder: name };
          }
          this.canRestart = true;
        });
      });
    } else if (isNewBest) {
      this.newBestLabel.graphics.opacity = 1;
      this.worldRecordLabel.text = globalRecord.score > 0
        ? `WORLD RECORD  ${globalRecord.score} by ${globalRecord.holder}`
        : '';
    } else {
      this.worldRecordLabel.text = globalRecord.score > 0
        ? `WORLD RECORD  ${globalRecord.score} by ${globalRecord.holder}`
        : '';
    }

    this.blinkTimer = 0;
  }

  onPreUpdate(engine: Engine, delta: number) {
    // Blink the restart prompt
    this.blinkTimer += delta;
    if (this.promptLabel) {
      this.promptLabel.graphics.opacity = Math.sin(this.blinkTimer / 450) > 0 ? 1 : 0.2;
    }

    if (!this.canRestart) return;

    if (
      engine.input.keyboard.wasPressed(Keys.Space) ||
      engine.input.keyboard.wasPressed(Keys.Enter)
    ) {
      engine.goToScene('game');
    }
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass (GameOverScene isn't directly unit tested — it's integration-level).

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat: add world record detection, name input, and coffee banner to GameOverScene"
```

---

### Task 8: Deploy and verify end-to-end

**Files:**
- No file changes — deployment and manual verification

- [ ] **Step 1: Run all tests one final time**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Build locally to check for compile errors**

```bash
npm run build
```

Expected: Clean build, output in `dist/`.

- [ ] **Step 3: Push and deploy**

```bash
git push origin HEAD
vercel --prod
```

Expected: Deployment succeeds, status READY.

- [ ] **Step 4: Verify GET /api/highscore works**

```bash
curl https://game.parthjpatel.me/api/highscore
```

Expected: `{"score":0,"holder":""}` (empty on first deploy).

- [ ] **Step 5: Verify POST /api/highscore works**

```bash
curl -X POST https://game.parthjpatel.me/api/highscore \
  -H 'Content-Type: application/json' \
  -d '{"score": 1, "name": "test"}'
```

Expected: `{"success":true,"isNewRecord":true}`

- [ ] **Step 6: Reset the test record**

```bash
curl -X POST https://game.parthjpatel.me/api/highscore \
  -H 'Content-Type: application/json' \
  -d '{"score": 0, "name": ""}'
```

This will be rejected (score must be > 0) — the test record of 1 is low enough that any real player will beat it immediately.

- [ ] **Step 7: Play-test the game**

Open https://game.parthjpatel.me in a browser:
1. Verify "WORLD RECORD" label shows in GameScene (top-right area)
2. Play and die — verify GameOverScene shows world record info
3. Beat the current record — verify name input appears, coffee banner shows after submission
