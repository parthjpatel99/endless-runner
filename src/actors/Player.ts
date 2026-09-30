import { Actor, CollisionType, Color, Keys, Engine, GraphicsGroup, Rectangle, vec } from 'excalibur';
import type { GraphicsGrouping } from 'excalibur';
import { CONFIG } from '../config';
import { soundManager } from '../audio/SoundManager';
import { Ground } from './Ground';
import { consumeTap } from '../systems/TapInput';

const W = CONFIG.playerWidth;
const H = CONFIG.playerHeight;
const BODY_H = 42;
const LEG_W = 9;

function rect(width: number, height: number, color: string, x: number, y: number): GraphicsGrouping {
  // Offsets relative to the actor centre (see useAnchor: false below)
  return { graphic: new Rectangle({ width, height, color: Color.fromHex(color) }), offset: vec(x - W / 2, y - H / 2) };
}

/** Pixel runner: a cream block with one eye; `stride` picks the leg pose */
function runnerFrame(stride: 'a' | 'b' | 'air'): GraphicsGroup {
  const legTop = BODY_H;
  const full = H - BODY_H;
  const members: GraphicsGrouping[] = [
    rect(W, BODY_H, CONFIG.playerColor, 0, 0),
    rect(7, 7, CONFIG.playerEyeColor, W - 13, 8),
  ];
  if (stride === 'a') {
    members.push(rect(LEG_W, full, CONFIG.playerColor, 6, legTop));
    members.push(rect(LEG_W, full - 7, CONFIG.playerColor, W - 6 - LEG_W, legTop));
  } else if (stride === 'b') {
    members.push(rect(LEG_W, full - 7, CONFIG.playerColor, 6, legTop));
    members.push(rect(LEG_W, full, CONFIG.playerColor, W - 6 - LEG_W, legTop));
  } else {
    members.push(rect(LEG_W, full - 9, CONFIG.playerColor, 4, legTop));
    members.push(rect(LEG_W, full - 9, CONFIG.playerColor, W - 4 - LEG_W, legTop));
  }
  return new GraphicsGroup({ members, useAnchor: false });
}

export class Player extends Actor {
  private isOnGround = true;
  private jumpCount = 0;
  private inputCooldown = 0; // ms remaining to ignore input after reset
  private strideTimer = 0;
  private frames = { a: runnerFrame('a'), b: runnerFrame('b'), air: runnerFrame('air') };
  private currentFrame: 'a' | 'b' | 'air' = 'a';
  /** While true the runner stands still and ignores input (start screen) */
  frozen = false;

  constructor() {
    super({
      x: CONFIG.playerX,
      y: CONFIG.groundY - CONFIG.playerHeight / 2,
      width: CONFIG.playerWidth,
      height: CONFIG.playerHeight,
      color: Color.fromHex(CONFIG.playerColor),
      collisionType: CollisionType.Active,
    });
    this.graphics.use(this.frames.a);
  }

  onInitialize(_engine: Engine) {
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Ground) {
        this.isOnGround = true;
        this.jumpCount = 0;
      }
    });

    this.on('collisionend', (evt) => {
      if (evt.other instanceof Ground) {
        this.isOnGround = false;
      }
    });
  }

  private setFrame(frame: 'a' | 'b' | 'air') {
    if (frame === this.currentFrame) return;
    this.currentFrame = frame;
    this.graphics.use(this.frames[frame]);
  }

  onPreUpdate(engine: Engine, delta: number) {
    if (this.frozen) {
      this.setFrame('a');
      return;
    }

    // Read (and clear) any tap every frame so taps during the cooldown are discarded
    const tapped = consumeTap();

    // Drain input cooldown (prevents auto-jump on scene restart via Space)
    if (this.inputCooldown > 0) {
      this.inputCooldown -= delta;
      return;
    }

    const groundLevel = CONFIG.groundY - CONFIG.playerHeight / 2;

    // Position-based ground detection (reliable; collision events can miss after teleport)
    if (this.pos.y >= groundLevel) {
      this.pos.y = groundLevel;
      this.vel.y = 0;
      this.isOnGround = true;
      this.jumpCount = 0;
    }

    // Jump on space, up arrow, or a tap/click on the canvas
    if (
      (engine.input.keyboard.wasPressed(Keys.Space) ||
        engine.input.keyboard.wasPressed(Keys.Up) ||
        engine.input.keyboard.wasPressed(Keys.ArrowUp) ||
        tapped) &&
      this.isOnGround
    ) {
      this.vel.y = CONFIG.jumpForce;
      this.isOnGround = false;
      this.jumpCount++;
      soundManager.playJump();
    }

    // Clamp to ceiling
    if (this.pos.y < CONFIG.playerHeight / 2) {
      this.pos.y = CONFIG.playerHeight / 2;
      this.vel.y = 0;
    }

    // Leg animation (frozen while the scene is paused on game over: vel.x === 0 and not updated)
    if (!this.isOnGround) {
      this.setFrame('air');
    } else {
      this.strideTimer += delta;
      if (this.strideTimer >= CONFIG.playerStrideMs) {
        this.strideTimer = 0;
        this.setFrame(this.currentFrame === 'a' ? 'b' : 'a');
      } else if (this.currentFrame === 'air') {
        this.setFrame('a');
      }
    }
  }

  reset() {
    this.isOnGround = true;
    this.jumpCount = 0;
    this.vel.x = 0;
    this.vel.y = 0;
    this.strideTimer = 0;
    this.setFrame('a');
    this.inputCooldown = 100; // 100ms to absorb the restart keypress
  }

  get onGround() {
    return this.isOnGround;
  }
}
