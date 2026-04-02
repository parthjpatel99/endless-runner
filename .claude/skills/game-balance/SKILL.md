---
name: game-balance
description: Guide for tuning endless runner game feel — difficulty ramp, jump physics, obstacle density. Use when the user asks to make the game harder/easier or tweak feel.
---

# Game Balance Tuning

All constants live in `src/config.ts`. Open it first.

## Difficulty Ramp
- `initialSpeed` (default 300) — starting scroll speed in px/s. Lower = easier start.
- `maxSpeed` (default 800) — speed ceiling. Raise to extend difficulty progression.
- `speedIncrement` (default 20) — px/s added every `speedInterval` seconds. Raise for steeper curve.
- `speedInterval` (default 3) — seconds between speed increases. Lower = faster ramp.

**Rule of thumb:** `initialSpeed` is ~37.5% of `maxSpeed` by default — keep this ratio (35–42%) for a comfortable entry.

## Jump Feel
- `jumpForce` (default -700) — initial upward velocity. More negative = higher jump.
- `gravity` (default 1800) — downward acceleration applied by Excalibur's physics engine. Higher = snappier, punishing arc.

**Good combos:**
- Floaty: jumpForce -600, gravity 1200
- Snappy: jumpForce -750, gravity 2000
- Default (arcade): jumpForce -700, gravity 1800

## Obstacle Density
- `minObstacleGap` (default 300) — minimum pixel gap between obstacles
- `maxObstacleGap` (default 600) — maximum pixel gap

**Warning:** At max speed (800 px/s), a 300px gap gives ~0.375s reaction time. Going below 250px at high speeds feels unfair.

## Obstacle Size
- `obstacleMinHeight` (default 40) — shortest obstacle; can be cleared without a full jump
- `obstacleMaxHeight` (default 120) — tallest obstacle; requires full jump

## Checklist for a Balance Change
- [ ] Edit constants in `src/config.ts`
- [ ] `npm run dev` — playtest manually for 60+ seconds
- [ ] Verify player can still clear max-height obstacle at max speed
- [ ] Run `npm test` to confirm no regressions
- [ ] Commit with message describing the feel change and why
