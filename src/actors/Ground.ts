import { Actor, CollisionType, Color } from 'excalibur';
import { CONFIG } from '../config';

export class Ground extends Actor {
  constructor() {
    super({
      x: CONFIG.width / 2,
      y: CONFIG.groundY + CONFIG.groundHeight / 2,
      width: CONFIG.width * 3, // extra wide so it covers the viewport
      height: CONFIG.groundHeight,
      color: Color.fromHex(CONFIG.groundColor),
      collisionType: CollisionType.Fixed,
    });
  }
}
