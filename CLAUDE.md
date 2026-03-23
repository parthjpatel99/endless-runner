# Endless Runner — Claude Context

## Project
Browser-based arcade game built with Excalibur.js v0.32, TypeScript 5.9, Vite 8, Vitest 4.

## Architecture
- `src/config.ts` — ALL game constants (speeds, forces, sizes, colors). Touch here first when tuning balance.
- `src/actors/` — Excalibur `Actor` subclasses: `Player`, `Obstacle`, `Ground`, `ParallaxBackground`
- `src/scenes/` — `GameScene` (main loop, scoring, collision) and `GameOverScene`
- `src/systems/ObstacleSpawner.ts` — procedural obstacle generation
- `src/audio/SoundManager.ts` — Web Audio API synthesis (no audio files)
- `src/__tests__/` — Vitest unit tests

## Key Commands
- `npm run dev` — start dev server at localhost:5173
- `npm test` — run unit tests
- `npm run build` — production build → dist/

## Adding Obstacles
1. Create `src/actors/YourObstacle.ts` extending `Actor` (follow `Obstacle.ts` pattern)
2. Add config constants to `src/config.ts`
3. Register in `ObstacleSpawner.ts` spawn logic
4. Add tests in `src/__tests__/`

## Balance Constants (src/config.ts)
- `initialSpeed` / `maxSpeed` / `speedIncrement` / `speedInterval` — difficulty ramp
- `jumpForce` / `gravity` — feel of jumping
- `minObstacleGap` / `maxObstacleGap` — obstacle density
- `obstacleMinHeight` / `obstacleMaxHeight` — obstacle difficulty range
