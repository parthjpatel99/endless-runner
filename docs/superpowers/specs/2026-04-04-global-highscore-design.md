# Global High Score with Coffee Challenge

## Overview

Add a global all-time high score system so every player competes for the #1 spot. The current world record holder sees a message inviting them to email Parth for a free coffee.

## Backend

### Storage: Upstash Redis (Vercel Marketplace)

A single Redis hash key `highscore` with fields:
- `score` (number) — the global best score
- `holder` (string) — alias/name of the record holder

### API Routes

Two serverless functions in `/api`:

**`GET /api/highscore`**
- Returns `{ score: number, holder: string }` or `{ score: 0, holder: "" }` if no record exists.
- No authentication required.

**`POST /api/highscore`**
- Body: `{ score: number, name: string }`
- Server validates:
  - `score` is a positive integer
  - `score` does not exceed a sane maximum (e.g., 10,000 — based on `maxSpeed` and realistic play time)
  - `name` is 1-20 characters, alphanumeric + spaces only
- Uses Redis `GET` then conditional `SET` (atomic via `WATCH`/`MULTI` or Lua script) to only update if submitted score > current record.
- Returns `{ success: true, isNewRecord: true }` or `{ success: false, isNewRecord: false }`.

### Anti-Cheat (Basic)

- **Score ceiling**: Reject scores above a configurable max (e.g., 10,000). This is a casual game — not trying to be bulletproof.
- **Rate limit**: One submission per IP per 10 seconds (via simple in-memory or Redis-based counter).
- **Server-side validation only**: No client-side score signing — keeps it simple.

## Frontend Changes

### GameScene

- On `onActivate()`, fetch `GET /api/highscore`.
- Display a "WORLD RECORD" label below the existing personal best label (top-right area).
  - Format: `WORLD RECORD: {score} by {holder}`
  - Style: 14px Orbitron, gold (#ffd60a), matching existing UI aesthetic.
- Store fetched global high score in a scene property for comparison at game over.

### GameOverScene

**Standard flow (did not beat record):**
- No changes to existing layout. Global record is shown as additional info below the personal best line.
- Format: `WORLD RECORD: {score} by {holder}`

**New record flow:**
1. Detect `lastScore > globalHighScore` on scene activate.
2. Show celebratory banner:
   - "NEW WORLD RECORD!" in large gold text with a glow/pulse animation.
3. Show a simple name input prompt:
   - Label: "Enter your name:"
   - HTML `<input>` overlay positioned over the canvas (Excalibur doesn't have native text input).
   - Submit button or Enter key to confirm.
   - Default placeholder: "Anonymous"
   - Max 20 chars, sanitized to alphanumeric + spaces.
4. On submit, `POST /api/highscore` with `{ score, name }`.
5. On success, show the coffee banner:
   - **"You're #1! Email me at parth8199@gmail.com to claim a coffee"**
   - Style: 16px, white text on a semi-transparent dark overlay, with a gold border.
   - Persists on screen alongside the restart prompt.
6. On API failure, silently fall back to just showing "NEW WORLD RECORD!" without the name submission.

**Already holds record:**
- If the player's score matches or exceeds the global record (even if they don't beat it this run), they already hold the record — no special handling needed beyond normal display.

### Error Handling

- If `GET /api/highscore` fails (network error, Redis down), the game plays normally — global record section just shows "WORLD RECORD: ---" or is hidden.
- If `POST /api/highscore` fails, the player still sees "NEW WORLD RECORD!" locally but the coffee message is not shown (since we can't confirm the submission).
- All API calls are fire-and-forget from the game loop perspective — never block gameplay.

## Infrastructure Setup

1. Install Upstash Redis via Vercel Marketplace for the `salvador` project.
2. Environment variables auto-provisioned: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
3. Pull env vars locally with `vercel env pull`.
4. Install `@upstash/redis` as a dependency.

## File Changes Summary

| File | Change |
|------|--------|
| `api/highscore.ts` | New — serverless function handling GET and POST |
| `src/config.ts` | Add `maxSubmittableScore`, global highscore UI styling constants |
| `src/scenes/GameScene.ts` | Fetch and display global record on activate |
| `src/scenes/GameOverScene.ts` | New record detection, name input, coffee banner, POST submission |
| `package.json` | Add `@upstash/redis` dependency |
| `vercel.json` or `vercel.ts` | CORS/routing config if needed for `/api` routes |

## UX Flow

1. Player loads game -> sees "WORLD RECORD: 350 by alice" top-right
2. Player dies with score 400 -> GameOverScene detects new record
3. "NEW WORLD RECORD!" banner appears
4. Name input prompt -> player types alias -> submits
5. Coffee banner: "You're #1! Email me at parth8199@gmail.com to claim a coffee"
6. Next visitor sees "WORLD RECORD: 400 by [alias]"
