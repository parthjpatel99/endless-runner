import { Actor, CollisionType, Color, Keys, Engine } from 'excalibur';
import { CONFIG } from '../config';

export class Player extends Actor {
  private isOnGround = false;
  private jumpCount = 0;
  private readonly maxJumps = 1; // single jump

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

  get onGround() {
    return this.isOnGround;
  }
}
