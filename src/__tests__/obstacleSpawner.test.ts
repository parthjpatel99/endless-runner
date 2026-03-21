import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONFIG } from '../config';

// Pure gap calculation extracted from ObstacleSpawner
function calculateGap(): number {
  return CONFIG.minObstacleGap + Math.random() * (CONFIG.maxObstacleGap - CONFIG.minObstacleGap);
}

// Pure obstacle height calculation extracted from ObstacleSpawner
function calculateHeight(): number {
  return CONFIG.obstacleMinHeight + Math.random() * (CONFIG.obstacleMaxHeight - CONFIG.obstacleMinHeight);
}

// Minimal testable spawner that mirrors ObstacleSpawner logic without Excalibur
interface MockObstacle {
  x: number;
  killed: boolean;
  kill: () => void;
}

class TestableSpawner {
  private timeUntilNextSpawn: number;
  private obstacles: MockObstacle[] = [];
  private spawnCallback: (x: number) => MockObstacle;

  constructor(spawnCallback: (x: number) => MockObstacle) {
    this.spawnCallback = spawnCallback;
    this.timeUntilNextSpawn = CONFIG.minObstacleGap;
  }

  update(delta: number, currentSpeed: number) {
    this.timeUntilNextSpawn -= (delta / 1000) * currentSpeed;

    if (this.timeUntilNextSpawn <= 0) {
      const obs = this.spawnCallback(CONFIG.width + 50);
      this.obstacles.push(obs);
      this.timeUntilNextSpawn =
        CONFIG.minObstacleGap +
        Math.random() * (CONFIG.maxObstacleGap - CONFIG.minObstacleGap);
    }

    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.x < -100) {
        obs.kill();
        return false;
      }
      return true;
    });
  }

  getObstacles(): MockObstacle[] {
    return this.obstacles;
  }

  reset() {
    for (const obs of this.obstacles) {
      obs.kill();
    }
    this.obstacles = [];
    this.timeUntilNextSpawn = CONFIG.minObstacleGap;
  }
}

function makeMockObstacle(x: number): MockObstacle {
  return { x, killed: false, kill() { this.killed = true; } };
}

describe('Gap calculation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns minObstacleGap when Math.random() is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const gap = calculateGap();
    expect(gap).toBe(CONFIG.minObstacleGap);
  });

  it('returns maxObstacleGap when Math.random() is 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const gap = calculateGap();
    expect(gap).toBe(CONFIG.maxObstacleGap);
  });

  it('gap is always within [minObstacleGap, maxObstacleGap] for many random values', () => {
    for (let i = 0; i < 100; i++) {
      const gap = calculateGap();
      expect(gap).toBeGreaterThanOrEqual(CONFIG.minObstacleGap);
      expect(gap).toBeLessThanOrEqual(CONFIG.maxObstacleGap);
    }
  });
});

describe('Obstacle height calculation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns minHeight when Math.random() is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateHeight()).toBe(CONFIG.obstacleMinHeight);
  });

  it('returns maxHeight when Math.random() is 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(calculateHeight()).toBe(CONFIG.obstacleMaxHeight);
  });

  it('height is always within [minHeight, maxHeight] for many random values', () => {
    for (let i = 0; i < 100; i++) {
      const h = calculateHeight();
      expect(h).toBeGreaterThanOrEqual(CONFIG.obstacleMinHeight);
      expect(h).toBeLessThanOrEqual(CONFIG.obstacleMaxHeight);
    }
  });
});

describe('TestableSpawner — spawn timing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not spawn an obstacle before enough distance has been traveled', () => {
    const spawner = new TestableSpawner(makeMockObstacle);
    // travel only half of minObstacleGap at speed 300
    const speed = 300;
    const delta = ((CONFIG.minObstacleGap / 2) / speed) * 1000;
    spawner.update(delta, speed);
    expect(spawner.getObstacles()).toHaveLength(0);
  });

  it('spawns exactly one obstacle after minObstacleGap distance is covered', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // next gap = minObstacleGap
    const spawner = new TestableSpawner(makeMockObstacle);
    const speed = 300;
    // slightly more than minObstacleGap pixels
    const delta = ((CONFIG.minObstacleGap + 1) / speed) * 1000;
    spawner.update(delta, speed);
    expect(spawner.getObstacles()).toHaveLength(1);
  });
});

describe('TestableSpawner — off-screen removal', () => {
  it('removes obstacles that have moved past x < -100', () => {
    const spawner = new TestableSpawner(makeMockObstacle);
    // manually inject an obstacle already off-screen
    const offscreen: MockObstacle = { x: -101, killed: false, kill() { this.killed = true; } };
    (spawner as unknown as { obstacles: MockObstacle[] }).obstacles.push(offscreen);

    // update with a tiny delta so spawn timer doesn't fire
    vi.spyOn(Math, 'random').mockReturnValue(0);
    spawner.update(1, 300);
    expect(spawner.getObstacles()).toHaveLength(0);
    expect(offscreen.killed).toBe(true);
  });
});

describe('TestableSpawner — reset', () => {
  it('clears all obstacles and calls kill on each', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const spawner = new TestableSpawner(makeMockObstacle);
    const speed = 300;
    const delta = ((CONFIG.minObstacleGap + 1) / speed) * 1000;
    spawner.update(delta, speed);
    expect(spawner.getObstacles()).toHaveLength(1);

    const obsBeforeReset = spawner.getObstacles()[0];
    spawner.reset();
    expect(spawner.getObstacles()).toHaveLength(0);
    expect(obsBeforeReset.killed).toBe(true);
  });
});
