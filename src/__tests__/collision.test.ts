import { describe, it, expect } from 'vitest';
import { CONFIG } from '../config';

// AABB overlap function — mirrors the logic used in GameScene
function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

// Helpers that return bounding boxes matching the actual actor constructors
function playerBounds() {
  return {
    x: CONFIG.playerX,
    y: CONFIG.groundY - CONFIG.playerHeight / 2,
    w: CONFIG.playerWidth,
    h: CONFIG.playerHeight,
  };
}

function obstacleBounds(height: number) {
  return {
    x: CONFIG.width + 50,
    y: CONFIG.groundY - height / 2,
    w: CONFIG.obstacleWidth,
    h: height,
  };
}

describe('AABB overlaps()', () => {
  it('detects overlap when two boxes share the same centre', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(overlaps(a, a)).toBe(true);
  });

  it('detects overlap when boxes partially intersect', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(overlaps(a, b)).toBe(true);
  });

  it('returns false when boxes are clearly separated horizontally', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 100, y: 0, w: 10, h: 10 };
    expect(overlaps(a, b)).toBe(false);
  });

  it('returns false when boxes are clearly separated vertically', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 0, y: 100, w: 10, h: 10 };
    expect(overlaps(a, b)).toBe(false);
  });

  it('returns false when boxes touch exactly at edge (no penetration)', () => {
    // right edge of a == left edge of b
    const a = { x: 0, y: 0, w: 10, h: 10 }; // extends from -5 to 5
    const b = { x: 10, y: 0, w: 10, h: 10 }; // extends from 5 to 15
    // At edge: a.x + a.w/2 === b.x - b.w/2 → 5 === 5, strict < fails
    expect(overlaps(a, b)).toBe(false);
  });
});

describe('Player bounding box', () => {
  it('has the correct width and height from CONFIG', () => {
    const pb = playerBounds();
    expect(pb.w).toBe(CONFIG.playerWidth);
    expect(pb.h).toBe(CONFIG.playerHeight);
  });

  it('centre Y is above ground surface (feet at groundY)', () => {
    const pb = playerBounds();
    // centre should be exactly groundY - playerHeight/2
    expect(pb.y).toBe(CONFIG.groundY - CONFIG.playerHeight / 2);
    // bottom edge should equal groundY
    expect(pb.y + pb.h / 2).toBe(CONFIG.groundY);
  });
});

describe('Obstacle bounding box', () => {
  it('has the correct width from CONFIG', () => {
    const ob = obstacleBounds(CONFIG.obstacleMinHeight);
    expect(ob.w).toBe(CONFIG.obstacleWidth);
  });

  it('centre Y places the obstacle so its bottom is at groundY', () => {
    const height = CONFIG.obstacleMinHeight;
    const ob = obstacleBounds(height);
    expect(ob.y + ob.h / 2).toBe(CONFIG.groundY);
  });

  it('spawns off the right edge of the screen', () => {
    const ob = obstacleBounds(CONFIG.obstacleMinHeight);
    expect(ob.x).toBeGreaterThan(CONFIG.width);
  });
});

describe('Player vs Obstacle collision scenarios', () => {
  it('player on ground does NOT collide with a distant obstacle (off-screen)', () => {
    const player = playerBounds();
    const obstacle = obstacleBounds(CONFIG.obstacleMinHeight);
    // obstacle starts at CONFIG.width + 50, player at CONFIG.playerX — far apart
    expect(overlaps(player, obstacle)).toBe(false);
  });

  it('player on ground DOES collide when obstacle is at player X', () => {
    const player = playerBounds();
    // Place obstacle directly on top of player position
    const obstacle = {
      x: CONFIG.playerX,
      y: CONFIG.groundY - CONFIG.obstacleMinHeight / 2,
      w: CONFIG.obstacleWidth,
      h: CONFIG.obstacleMinHeight,
    };
    expect(overlaps(player, obstacle)).toBe(true);
  });

  it('player jumping above obstacle does NOT collide', () => {
    // player at top of screen — well above any obstacle
    const player = { x: CONFIG.playerX, y: 0, w: CONFIG.playerWidth, h: CONFIG.playerHeight };
    const obstacle = {
      x: CONFIG.playerX,
      y: CONFIG.groundY - CONFIG.obstacleMinHeight / 2,
      w: CONFIG.obstacleWidth,
      h: CONFIG.obstacleMinHeight,
    };
    expect(overlaps(player, obstacle)).toBe(false);
  });
});
