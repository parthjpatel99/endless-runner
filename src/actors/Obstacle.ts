import { Actor, CollisionType, Color } from 'excalibur';
import { CONFIG } from '../config';

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
  }
}
