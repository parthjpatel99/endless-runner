import { Actor, CollisionType, Color, Polygon, Scene, vec } from 'excalibur';
import { CONFIG } from '../config';

export interface RidgeLayerConfig {
  color: string;
  speedMultiplier: number;
  count: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  yBase: number;
}

interface Peak {
  actor: Actor;
  width: number;
}

/** A lopsided mesa/peak silhouette — like the Tucson Mountains at dusk */
function peakShape(w: number, h: number): Polygon {
  const crest = 0.35 + Math.random() * 0.3;
  return new Polygon({
    points: [
      vec(0, h),
      vec(w * (crest - 0.18), h * 0.35),
      vec(w * crest, 0),
      vec(w * (crest + 0.08), h * 0.12),
      vec(w * (crest + 0.22), h * 0.4),
      vec(w, h),
    ],
    color: Color.fromHex(CONFIG.backgroundColor),
  });
}

export class ParallaxLayer {
  private peaks: Peak[] = [];
  private speedMultiplier: number;

  constructor(scene: Scene, layer: RidgeLayerConfig, zIndex: number) {
    this.speedMultiplier = layer.speedMultiplier;

    const spacing = CONFIG.width / layer.count;
    for (let i = 0; i < layer.count + 2; i++) {
      const h = layer.minHeight + Math.random() * (layer.maxHeight - layer.minHeight);
      const w = layer.minWidth + Math.random() * (layer.maxWidth - layer.minWidth);
      const actor = new Actor({
        x: i * spacing + Math.random() * 20,
        y: layer.yBase - h / 2,
        width: w,
        height: h,
        collisionType: CollisionType.PreventCollision,
        z: zIndex,
      });
      const shape = peakShape(w, h);
      shape.color = Color.fromHex(layer.color);
      actor.graphics.use(shape);
      scene.add(actor);
      this.peaks.push({ actor, width: w });
    }
  }

  update(currentSpeed: number, delta: number) {
    const dx = (currentSpeed * this.speedMultiplier * delta) / 1000;

    // First pass: move all peaks
    for (const p of this.peaks) {
      p.actor.pos.x -= dx;
    }

    // Second pass: wrap any off-screen peak to just behind the rightmost one
    for (const p of this.peaks) {
      if (p.actor.pos.x < -p.width) {
        let maxX = -Infinity;
        for (const p2 of this.peaks) {
          if (p2.actor.pos.x > maxX) maxX = p2.actor.pos.x;
        }
        // Overlap neighbours so the ridgeline stays continuous
        p.actor.pos.x = maxX + p.width * (0.45 + Math.random() * 0.25);
      }
    }
  }

  reset() {
    // Scatter peaks across screen width on reset
    const count = this.peaks.length;
    const spacing = CONFIG.width / Math.max(count - 2, 1);
    for (let i = 0; i < count; i++) {
      this.peaks[i].actor.pos.x = i * spacing + Math.random() * 20;
    }
  }
}
