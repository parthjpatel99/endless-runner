import { Actor, CollisionType, Color } from 'excalibur';
import { CONFIG } from '../config';

// Much deeper than the canvas so tall/portrait screens (FitScreenAndFill shows
// area outside the 800×400 world) see sand below the track, not empty sky.
const DEPTH = CONFIG.groundHeight + 1600;

export class Ground extends Actor {
  constructor() {
    super({
      x: CONFIG.width / 2,
      y: CONFIG.groundY + DEPTH / 2,
      width: CONFIG.width * 3, // extra wide so it covers the viewport
      height: DEPTH,
      color: Color.fromHex(CONFIG.groundColor),
      collisionType: CollisionType.Fixed,
    });
  }
}
