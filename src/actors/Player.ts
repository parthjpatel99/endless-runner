import { Actor, CollisionType, Color, Keys, Engine } from 'excalibur';
import { CONFIG } from '../config';
import { soundManager } from '../audio/SoundManager';

export class Player extends Actor {
  private isOnGround = true;
  private jumpCount = 0;
  private readonly maxJumps = 1; // single jump
  private inputCooldown = 0; // frames to ignore input after reset

  constructor() {
    super({
      x: CONFIG.playerX,
      y: CONFIG.groundY - CONFIG.playerHeight / 2,
      width: CONFIG.playerWidth,
      height: CONFIG.playerHeight,
      color: Color.fromHex(CONFIG.playerColor),
      collisionType: CollisionType.Active,
    });
  }

  onInitialize(_engine: Engine) {
    // Listen for collision with ground
    this.on('collisionstart', (evt) => {
      if (evt.other.constructor.name === 'Ground') {
        this.isOnGround = true;
        this.jumpCount = 0;
      }
    });

    this.on('collisionend', (evt) => {
      if (evt.other.constructor.name === 'Ground') {
        this.isOnGround = false;
      }
    });
  }

  onPreUpdate(engine: Engine, _delta: number) {
    // Drain input cooldown (prevents auto-jump on scene restart via Space)
    if (this.inputCooldown > 0) {
      this.inputCooldown--;
      return;
    }

    // Jump on space or up arrow
    if (
      (engine.input.keyboard.wasPressed(Keys.Space) ||
        engine.input.keyboard.wasPressed(Keys.Up) ||
        engine.input.keyboard.wasPressed(Keys.ArrowUp)) &&
      (this.isOnGround || this.jumpCount < this.maxJumps)
    ) {
      this.vel.y = CONFIG.jumpForce;
      this.isOnGround = false;
      this.jumpCount++;
      soundManager.playJump();
    }

    // Clamp to ground (safety net)
    if (this.pos.y > CONFIG.groundY - CONFIG.playerHeight / 2) {
      this.pos.y = CONFIG.groundY - CONFIG.playerHeight / 2;
      this.vel.y = 0;
      this.isOnGround = true;
      this.jumpCount = 0;
    }

    // Clamp to ceiling
    if (this.pos.y < CONFIG.playerHeight / 2) {
      this.pos.y = CONFIG.playerHeight / 2;
      this.vel.y = 0;
    }
  }

  reset() {
    this.isOnGround = true;
    this.jumpCount = 0;
    this.vel.x = 0;
    this.vel.y = 0;
    this.inputCooldown = 2; // skip 2 frames to absorb the restart keypress
  }

  get onGround() {
    return this.isOnGround;
  }
}
