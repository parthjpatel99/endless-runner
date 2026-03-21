import { Scene, Engine, Color, vec, Font, Label, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { Player } from '../actors/Player';
import { Ground } from '../actors/Ground';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

export class GameScene extends Scene {
  private player!: Player;
  private ground!: Ground;
  private spawner!: ObstacleSpawner;
  private score = 0;
  private currentSpeed = CONFIG.initialSpeed;
  private speedTimer = 0;
  private scoreLabel!: Label;
  private isGameOver = false;
  private initialized = false;

  onInitialize(engine: Engine) {
    this.setupActors();
    this.setupUI(engine);
    this.initialized = true;
  }

  private setupActors() {
    this.ground = new Ground();
    this.add(this.ground);

    this.player = new Player();
    this.add(this.player);

    this.spawner = new ObstacleSpawner(this);
  }

  private setupUI(_engine: Engine) {
    this.scoreLabel = new Label({
      text: 'Score: 0',
      pos: vec(20, 20),
      font: new Font({
        size: 24,
        color: Color.White,
        family: 'monospace',
        textAlign: TextAlign.Left,
      }),
    });
    this.add(this.scoreLabel);
  }

  onActivate(_ctx: SceneActivationContext) {
    // Reset game state when scene activates
    this.score = 0;
    this.currentSpeed = CONFIG.initialSpeed;
    this.speedTimer = 0;
    this.isGameOver = false;

    if (this.initialized && this.spawner) {
      this.spawner.reset();
    }

    // Reset player position
    if (this.initialized && this.player) {
      this.player.pos.x = CONFIG.playerX;
      this.player.pos.y = CONFIG.groundY - CONFIG.playerHeight / 2;
      this.player.vel.x = 0;
      this.player.vel.y = 0;
    }

    if (this.initialized && this.scoreLabel) {
      this.scoreLabel.text = 'Score: 0';
    }
  }

  onPreUpdate(engine: Engine, delta: number) {
    if (this.isGameOver) return;

    // Update score
    this.score += (CONFIG.scorePerSecond * delta) / 1000;
    this.scoreLabel.text = `Score: ${Math.floor(this.score)}`;

    // Update speed
    this.speedTimer += delta / 1000;
    if (this.speedTimer >= CONFIG.speedInterval) {
      this.speedTimer = 0;
      this.currentSpeed = Math.min(
        this.currentSpeed + CONFIG.speedIncrement,
        CONFIG.maxSpeed
      );
    }

    // Update spawner
    this.spawner.update(delta, this.currentSpeed);

    // Check collision with obstacles using bounding boxes
    for (const obstacle of this.spawner.getObstacles()) {
      if (this.player.collider.bounds.overlaps(obstacle.collider.bounds)) {
        this.triggerGameOver(engine);
        return;
      }
    }
  }

  private triggerGameOver(engine: Engine) {
    this.isGameOver = true;
    // Store score for game over screen
    (engine as any).lastScore = Math.floor(this.score);
    engine.goToScene('gameover');
  }

  getCurrentScore() {
    return Math.floor(this.score);
  }
}
