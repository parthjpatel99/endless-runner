import { Actor, CollisionType, Color, Keys, Engine } from 'excalibur';
import { CONFIG } from '../config';
import { soundManager } from '../audio/SoundManager';
import { Ground } from './Ground';

export class Player extends Actor {
  private isOnGround = true;
  private jumpCount = 0;
  private inputCooldown = 0; // ms remaining to ignore input after reset

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

  onPreUpdate(engine: Engine, delta: number) {
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

    // Jump on space or up arrow
    if (
      (engine.input.keyboard.wasPressed(Keys.Space) ||
        engine.input.keyboard.wasPressed(Keys.Up) ||
        engine.input.keyboard.wasPressed(Keys.ArrowUp)) &&
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
  }

  reset() {
    this.isOnGround = true;
    this.jumpCount = 0;
    this.vel.x = 0;
    this.vel.y = 0;
    this.inputCooldown = 100; // 100ms to absorb the restart keypress
  }

  get onGround() {
    return this.isOnGround;
  }
}
