# Endless Runner — Codebase Briefing

## Overview

A browser-based arcade game built with **Excalibur.js**. The player auto-scrolls and must jump over procedurally-spawned obstacles while game speed increases over time. Goal: survive as long as possible for a high score.

---

## Directory Structure

```
src/
├── main.ts                  # Entry: Excalibur engine init + scene registration
├── config.ts                # All constants (gravity, speeds, dimensions, fonts)
├── actors/
│   ├── Player.ts            # Player character, jump mechanics, ground detection
│   ├── Obstacle.ts          # Random-height obstacle actor
│   ├── Ground.ts            # Static collision platform
│   └── ParallaxBackground.ts # 3-layer scrolling background
├── scenes/
│   ├── GameScene.ts         # Main game loop, score, speed scaling, collision
│   └── GameOverScene.ts     # End-screen, listens for restart input
├── systems/
│   └── ObstacleSpawner.ts   # Procedural obstacle generation
├── audio/
│   └── SoundManager.ts      # Synthesized audio via Web Audio API
└── __tests__/               # Vitest tests for collision + spawner logic
```

---

## Key Entry Points

| File | Role |
|------|------|
| `src/main.ts` | Creates `Engine` (800×400), registers `GameScene`/`GameOverScene`, blocks default Space/Arrow behavior |
| `src/scenes/GameScene.ts` | Frame loop: updates score, scales speed, ticks spawner, checks AABB collision, triggers game over |
| `src/actors/Player.ts` | Reads jump input, applies `vel.y = jumpForce (-700)`, position-based ground check each frame |
| `src/systems/ObstacleSpawner.ts` | Pixel-distance counter; spawns obstacles at random gaps (300–600px), random heights (40–120px) |
| `src/audio/SoundManager.ts` | `playJump()`, `playGameOver()`, `playScore()` — all synthesized, no asset files |

---

## Call Graph

```
main.ts
  └─ Engine → GameScene
       ├─ onActivate()       → reset player, spawner, score, camera
       └─ onPreUpdate(delta)
            ├─ parallax layers update
            ├─ score increment → playScore() at 100pt milestones
            ├─ speed increase (every 3s, max 800)
            ├─ ObstacleSpawner.update() → spawns Obstacle actors
            ├─ Player.onPreUpdate() → jump input → playJump()
            ├─ AABB overlap check (player vs each obstacle)
            └─ triggerGameOver() → screen shake → GoToScene('gameover')
                                            → playGameOver()
GameOverScene
  └─ onPreUpdate() → Space/Enter → GoToScene('game')
```

---

## State & Data Flow

**GameScene** owns the mutable game state:

| Property | Description |
|----------|-------------|
| `score` | Increments each frame by `scorePerSecond * delta/1000`; resets on restart |
| `currentSpeed` | Starts at 300, +20 every 3s, capped at 800; drives obstacles + parallax |
| `isGameOver` | Blocks further updates; triggers transition after 300ms shake |
| `shakeTimer` | 300ms camera shake on collision |

**Player** state:

| Property | Description |
|----------|-------------|
| `isOnGround` | Set by both collision events AND `pos.y >= groundLevel` (position check) |
| `inputCooldown` | Initialized to 5 frames on `reset()`; prevents auto-jump from restart keypress |

**Collision:** AABB (`collider.bounds.overlaps()`) checked manually in `GameScene.onPreUpdate()` per frame — not via Excalibur's built-in collision system.

---

## External Dependencies

| Dependency | Version | Role |
|------------|---------|------|
| excalibur | 0.32.0 | Game engine (actors, physics, scenes, input) |
| Vite | 8.0.1 | Dev server + build |
| Vitest | 4.1.0 | Unit tests |

No external assets — all audio is synthesized, all visuals are drawn programmatically.

---

## Current Branch Context

**Branch:** `fix/input-cooldown-restart-jump`

Addresses a dual bug:
1. Collision-event ground detection could miss after scene teleport → position-based check added to `Player.onPreUpdate()`
2. The Space key used to restart triggered an immediate jump → fixed by 5-frame `inputCooldown` on `Player.reset()`
