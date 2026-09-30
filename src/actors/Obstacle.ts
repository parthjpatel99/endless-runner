import { Actor, CollisionType, Color, GraphicsGroup, Rectangle, vec } from 'excalibur';
import type { GraphicsGrouping } from 'excalibur';
import { CONFIG } from '../config';

const W = CONFIG.obstacleWidth;

function rect(width: number, height: number, color: string, x: number, y: number): GraphicsGrouping {
  return { graphic: new Rectangle({ width, height, color: Color.fromHex(color) }), offset: vec(x, y) };
}

/**
 * A pixel-art saguaro. The trunk exactly matches the collider; the arms
 * stick out past it and are purely cosmetic, so near-misses feel fair.
 */
function saguaro(height: number): GraphicsGroup {
  // Offsets are relative to the actor's centre (useAnchor: false puts the
  // group's origin at the actor position)
  const top = -height / 2;
  const left = -W / 2;
  const members: GraphicsGrouping[] = [
    rect(W, height - 4, CONFIG.obstacleColor, left, top + 4),
    rect(W - 8, 4, CONFIG.obstacleColor, left + 4, top), // rounded-ish crown
    rect(3, height - 10, CONFIG.obstacleRibColor, left + 8, top + 8),
    rect(3, height - 10, CONFIG.obstacleRibColor, left + W - 11, top + 8),
  ];

  if (height >= CONFIG.obstacleArmMinHeight) {
    const armLen = 12;
    // Left arm: elbow at ~55% height, reaching up
    const ly = top + height * 0.55;
    members.push(rect(armLen, 8, CONFIG.obstacleColor, left - armLen, ly));
    members.push(rect(8, height * 0.28, CONFIG.obstacleColor, left - armLen, ly - height * 0.28 + 8));
    // Right arm: a bit higher
    const ry = top + height * 0.38;
    members.push(rect(armLen, 8, CONFIG.obstacleColor, left + W, ry));
    members.push(rect(8, height * 0.22, CONFIG.obstacleColor, left + W + armLen - 8, ry - height * 0.22 + 8));
  }

  return new GraphicsGroup({ members, useAnchor: false });
}

export class Obstacle extends Actor {
  constructor(x: number, height: number) {
    super({
      x,
      y: CONFIG.groundY - height / 2,
      width: CONFIG.obstacleWidth,
      height,
      color: Color.fromHex(CONFIG.obstacleColor),
      collisionType: CollisionType.PreventCollision,
    });
    this.graphics.use(saguaro(height));
  }
}
