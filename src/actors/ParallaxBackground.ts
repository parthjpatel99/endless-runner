import { Actor, CollisionType, Color, Scene } from 'excalibur';
import { CONFIG } from '../config';

interface Building {
  actor: Actor;
}

export class ParallaxLayer {
  private buildings: Building[] = [];
  private speedMultiplier: number;

  constructor(
    scene: Scene,
    speedMultiplier: number,
    color: string,
    count: number,
    yBase: number,
    minH: number,
    maxH: number,
    zIndex: number
  ) {
    this.speedMultiplier = speedMultiplier;

    const spacing = CONFIG.width / count;
    for (let i = 0; i < count + 2; i++) {
      const h = minH + Math.random() * (maxH - minH);
      const w = 30 + Math.random() * 40;
      const actor = new Actor({
        x: i * spacing + Math.random() * 20,
        y: yBase - h / 2,
        width: w,
        height: h,
        color: Color.fromHex(color),
        collisionType: CollisionType.PreventCollision,
        z: zIndex,
        anchor: { x: 0.5, y: 0.5 } as any,
      });
      scene.add(actor);
      this.buildings.push({ actor });
    }
  }

  update(currentSpeed: number, delta: number) {
    const dx = (currentSpeed * this.speedMultiplier * delta) / 1000;

    for (const b of this.buildings) {
      b.actor.pos.x -= dx;

      // If off screen left, teleport to right of the rightmost building
      if (b.actor.pos.x < -100) {
        const maxX = Math.max(...this.buildings.map(b2 => b2.actor.pos.x));
        b.actor.pos.x = maxX + 80 + Math.random() * 60;
      }
    }
  }

  reset() {
    // Scatter buildings across screen width on reset
    const count = this.buildings.length;
    const spacing = CONFIG.width / Math.max(count - 2, 1);
    for (let i = 0; i < count; i++) {
      this.buildings[i].actor.pos.x = i * spacing + Math.random() * 20;
    }
  }
}
