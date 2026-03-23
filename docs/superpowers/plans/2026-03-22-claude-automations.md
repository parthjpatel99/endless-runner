# Claude Automations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Claude Code automations (hooks, skills, subagent, CLAUDE.md) tailored to the endless-runner Excalibur.js game project.

**Architecture:** All automations live under `.claude/` — settings.json holds hooks, skills/ holds packaged workflows, and agents/ holds the reviewer subagent. A CLAUDE.md at the repo root provides project context to Claude in every session.

**Tech Stack:** TypeScript, Excalibur.js v0.32, Vite 8, Vitest 4

---

### Task 1: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with project context for Claude"
```

---

### Task 2: Create .claude/settings.json with Hooks

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Create settings.json with two hooks**

Hook 1 — PostToolUse: run tests after any Edit/Write
Hook 2 — PreToolUse: warn before edits to `src/config.ts`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd /Users/parthpatel/conductor/workspaces/endless_runner/melbourne && npm test 2>&1 | tail -30"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -q '\"file_path\".*src/config.ts' && echo 'WARNING: You are editing src/config.ts (game balance constants). Changes affect gameplay feel. Confirm this is intentional.' || true"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: add Claude hooks for auto-test and config.ts guard"
```

---

### Task 3: Create game-balance Skill

**Files:**
- Create: `.claude/skills/game-balance/SKILL.md`

- [ ] **Step 1: Write game-balance skill**

```markdown
---
name: game-balance
description: Guide for tuning endless runner game feel — difficulty ramp, jump physics, obstacle density. Use when the user asks to make the game harder/easier or tweak feel.
disable-model-invocation: true
---

# Game Balance Tuning

All constants live in `src/config.ts`. Open it first.

## Difficulty Ramp
- `initialSpeed` (default 300) — starting scroll speed in px/s. Lower = easier start.
- `maxSpeed` (default 800) — speed ceiling. Raise to extend difficulty progression.
- `speedIncrement` (default 20) — px/s added every `speedInterval` seconds. Raise for steeper curve.
- `speedInterval` (default 3) — seconds between speed increases. Lower = faster ramp.

**Rule of thumb:** Keep `initialSpeed` at ~35-40% of `maxSpeed` for a comfortable entry.

## Jump Feel
- `jumpForce` (default -700) — initial upward velocity. More negative = higher jump.
- `gravity` (default 1800) — downward acceleration. Higher = snappier, punishing arc.

**Good combos:**
- Floaty: jumpForce -600, gravity 1200
- Snappy: jumpForce -750, gravity 2000
- Default (arcade): jumpForce -700, gravity 1800

## Obstacle Density
- `minObstacleGap` (default 300) — minimum pixel gap between obstacles
- `maxObstacleGap` (default 600) — maximum pixel gap

**Warning:** At max speed (800 px/s), a 300px gap gives ~0.375s reaction time. Going below 250px at high speeds feels unfair.

## Obstacle Size
- `obstacleMinHeight` (default 40) — shortest obstacle; jumpable without full jump
- `obstacleMaxHeight` (default 120) — tallest obstacle; requires full jump

## Checklist for a Balance Change
- [ ] Edit constants in `src/config.ts`
- [ ] `npm run dev` — playtest manually for 60+ seconds
- [ ] Verify player can still clear max-height obstacle at max speed
- [ ] Run `npm test` to confirm no regressions
- [ ] Commit with message describing the feel change and why
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/game-balance/SKILL.md
git commit -m "feat: add game-balance skill for tuning difficulty constants"
```

---

### Task 4: Create add-obstacle Skill

**Files:**
- Create: `.claude/skills/add-obstacle/SKILL.md`

- [ ] **Step 1: Write add-obstacle skill**

```markdown
---
name: add-obstacle
description: Step-by-step workflow for adding a new obstacle type to the endless runner game. Use when user asks to create a new obstacle variant.
disable-model-invocation: true
---

# Adding a New Obstacle Type

Follow these steps in order. The existing `Obstacle` class is the reference pattern.

## Step 1: Name and Config

Pick a name (e.g. `FloatingObstacle`, `WideObstacle`).

Add constants to `src/config.ts`:
```typescript
// YourObstacle
yourObstacleColor: '#hexcolor',
yourObstacleWidth: 30,         // horizontal size
yourObstacleMinHeight: 40,     // min random height
yourObstacleMaxHeight: 100,    // max random height
```

## Step 2: Create the Actor

Create `src/actors/YourObstacle.ts`:
```typescript
import { Actor, CollisionType, Color } from 'excalibur';
import { CONFIG } from '../config';

export class YourObstacle extends Actor {
  constructor(x: number, height: number) {
    super({
      x,
      y: CONFIG.groundY - height / 2,
      width: CONFIG.yourObstacleWidth,
      height,
      color: Color.fromHex(CONFIG.yourObstacleColor),
      collisionType: CollisionType.Passive,
    });
  }
}
```

For floating obstacles, adjust `y` to position above the ground.

## Step 3: Register in ObstacleSpawner

In `src/systems/ObstacleSpawner.ts`:
1. Import your class: `import { YourObstacle } from '../actors/YourObstacle';`
2. In `spawnObstacle()`, add logic to randomly spawn your type (e.g. 30% chance):
```typescript
private spawnObstacle(currentSpeed: number) {
  const useYourType = Math.random() < 0.3;
  let obstacle: Obstacle | YourObstacle;

  if (useYourType) {
    const height = CONFIG.yourObstacleMinHeight +
      Math.random() * (CONFIG.yourObstacleMaxHeight - CONFIG.yourObstacleMinHeight);
    obstacle = new YourObstacle(CONFIG.width + 50, height);
  } else {
    const height = CONFIG.obstacleMinHeight +
      Math.random() * (CONFIG.obstacleMaxHeight - CONFIG.obstacleMinHeight);
    obstacle = new Obstacle(CONFIG.width + 50, height);
  }

  obstacle.vel.x = -currentSpeed;
  this.scene.add(obstacle);
  this.obstacles.push(obstacle as Obstacle);
}
```

## Step 4: Write Tests

Add `src/__tests__/YourObstacle.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { YourObstacle } from '../actors/YourObstacle';

describe('YourObstacle', () => {
  it('creates obstacle at correct position', () => {
    const obs = new YourObstacle(900, 60);
    expect(obs.width).toBe(CONFIG.yourObstacleWidth);
  });
});
```

Run: `npm test`

## Step 5: Playtest and Commit
- `npm run dev` — verify obstacle spawns and looks correct
- Confirm it collides correctly with the player
- Commit: `git commit -m "feat: add YourObstacle type"`
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/add-obstacle/SKILL.md
git commit -m "feat: add add-obstacle skill with step-by-step workflow"
```

---

### Task 5: Create game-reviewer Subagent

**Files:**
- Create: `.claude/agents/game-reviewer.md`

- [ ] **Step 1: Write game-reviewer subagent**

```markdown
---
name: game-reviewer
description: Reviews code changes in the endless runner game for game-specific correctness — frame-rate sensitivity, physics consistency, scene lifecycle safety, and input handling. Dispatch after implementing new features or actor changes.
---

# Game Reviewer

You are a specialized code reviewer for a browser-based endless runner game built with Excalibur.js v0.32, TypeScript 5.9, Vite 8, and Vitest 4.

## Your Focus Areas

### 1. Frame-Rate Sensitivity
- All movement and timing must use `delta` (ms since last frame), never raw frame counts
- Speeds should be in px/s, multiplied by `delta / 1000`
- Timer accumulation: `timer += delta / 1000` (seconds), not `timer++`

### 2. Physics Consistency
- Gravity is applied via Excalibur's physics or manually in `Player.ts` — check for double-application
- `jumpForce` is applied once on input, not every frame
- Ground detection should prevent sub-ground clipping

### 3. Scene Lifecycle Safety
- Actors added in `onInitialize` must handle `onActivate` resets (GameScene resets score, speed, spawner)
- Actors that are `kill()`ed must be re-added if the scene restarts — check `initialized` guard pattern
- Labels and UI elements must be reset in `onActivate`

### 4. Obstacle/Collision Correctness
- New obstacles must use `CollisionType.Passive` (collision handled manually via bounding box overlap)
- Obstacles off-screen (`pos.x < -100`) must be `kill()`ed and removed from tracking arrays
- Speed applied as `vel.x = -currentSpeed` each frame in spawner's `update()`

### 5. Config Centralization
- No hardcoded magic numbers — all tunable values must live in `src/config.ts`
- Colors should use `CONFIG.*Color` constants and `Color.fromHex()`

### 6. Audio
- Sound calls must be fire-and-forget (no await) — Web Audio API is synchronous
- SoundManager should be defensive if AudioContext is suspended

## Review Output Format

For each issue found:
```
❌ [SEVERITY: high/medium/low] File:line — Description of issue
   Fix: What to change
```

If no issues:
```
✅ No game-specific issues found. Changes look correct.
```

Finish with a one-line summary: "Reviewed N files, found X issues."
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/game-reviewer.md
git commit -m "feat: add game-reviewer subagent for game-specific code review"
```

---

### Task 6: Note on context7 MCP

The `context7` MCP server must be installed by the user interactively — it modifies the user-level Claude Code config, not the repo.

- [ ] **Step 1: User runs this command in their terminal**

```bash
claude mcp add context7
```

This gives Claude live Excalibur.js API docs during any session in this project.

---
