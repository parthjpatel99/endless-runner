---
name: add-obstacle
description: Step-by-step workflow for adding a new obstacle type to the endless runner game. Use when the user asks to create a new obstacle variant.
---

# Adding a New Obstacle Type

Follow these steps in order. The existing `Obstacle` class (`src/actors/Obstacle.ts`) is the reference pattern.

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

Create `src/actors/YourObstacle.ts` extending `Actor` directly (same as `Obstacle`):
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
2. Widen the obstacles array type: `private obstacles: Array<Obstacle | YourObstacle> = [];`
3. In `spawnObstacle()`, add spawn logic (e.g. 30% chance):

```typescript
private spawnObstacle(currentSpeed: number) {
  let obstacle: Obstacle | YourObstacle;

  if (Math.random() < 0.3) {
    const height =
      CONFIG.yourObstacleMinHeight +
      Math.random() * (CONFIG.yourObstacleMaxHeight - CONFIG.yourObstacleMinHeight);
    obstacle = new YourObstacle(CONFIG.width + 50, height);
  } else {
    const height =
      CONFIG.obstacleMinHeight +
      Math.random() * (CONFIG.obstacleMaxHeight - CONFIG.obstacleMinHeight);
    obstacle = new Obstacle(CONFIG.width + 50, height);
  }

  obstacle.vel.x = -currentSpeed;
  this.scene.add(obstacle);
  this.obstacles.push(obstacle);
}
```

Also update `getObstacles()` return type if needed.

## Step 4: Write Tests

Add `src/__tests__/YourObstacle.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { YourObstacle } from '../actors/YourObstacle';
import { CONFIG } from '../config';

describe('YourObstacle', () => {
  it('creates obstacle at correct width', () => {
    const obs = new YourObstacle(900, 60);
    expect(obs.width).toBe(CONFIG.yourObstacleWidth);
  });
});
```

Run: `npm test`

## Step 5: Playtest and Commit
- `npm run dev` — verify obstacle spawns and looks correct
- Confirm it collides correctly with the player (bounding-box overlap check in `GameScene.ts`)
- Commit: `git commit -m "feat: add YourObstacle type"`
