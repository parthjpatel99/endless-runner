import { Scene, Engine, Color, vec, Font, Label, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { Player } from '../actors/Player';
import { Ground } from '../actors/Ground';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { ParallaxLayer } from '../actors/ParallaxBackground';
import { soundManager } from '../audio/SoundManager';

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
  private parallaxLayers: ParallaxLayer[] = [];
  private shakeTimer = 0;
  private lastScoreMilestone = 0;

  onInitialize(engine: Engine) {
    this.setupParallax();
    this.setupActors();
    this.setupUI(engine);
    this.initialized = true;
  }

  private setupParallax() {
    this.parallaxLayers = [];
    CONFIG.parallaxLayers.forEach((layerConfig, index) => {
      const layer = new ParallaxLayer(
        this,
        layerConfig.speedMultiplier,
        layerConfig.color,
        layerConfig.count,
        layerConfig.yBase,
        layerConfig.minHeight,
        layerConfig.maxHeight,
        -10 + index // z-index: further layers behind
      );
      this.parallaxLayers.push(layer);
    });
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
      z: 10,
    });
    this.add(this.scoreLabel);
  }

  onActivate(_ctx: SceneActivationContext) {
    // Reset game state when scene activates
    this.score = 0;
    this.currentSpeed = CONFIG.initialSpeed;
    this.speedTimer = 0;
    this.isGameOver = false;
    this.shakeTimer = 0;
    this.lastScoreMilestone = 0;

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

    // Reset parallax layers
    if (this.initialized) {
      for (const layer of this.parallaxLayers) {
        layer.reset();
      }
    }

    // Reset camera
    if (this.camera) {
      this.camera.pos.x = CONFIG.width / 2;
      this.camera.pos.y = CONFIG.height / 2;
    }
  }

  onPreUpdate(engine: Engine, delta: number) {
    // Handle screen shake regardless of game over state
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const progress = Math.max(0, this.shakeTimer / CONFIG.shakeDuration);
      const intensity = CONFIG.shakeIntensity * progress;
      this.camera.pos.x = CONFIG.width / 2 + (Math.random() - 0.5) * 2 * intensity;
      this.camera.pos.y = CONFIG.height / 2 + (Math.random() - 0.5) * 2 * intensity;
    } else if (!this.isGameOver) {
      this.camera.pos.x = CONFIG.width / 2;
      this.camera.pos.y = CONFIG.height / 2;
    }

    if (this.isGameOver) return;

    // Update parallax layers
    for (const layer of this.parallaxLayers) {
      layer.update(this.currentSpeed, delta);
    }

    // Update score
    this.score += (CONFIG.scorePerSecond * delta) / 1000;
    const currentFloorScore = Math.floor(this.score);
    this.scoreLabel.text = `Score: ${currentFloorScore}`;

    // Play score milestone sound every 100 points
    const milestone = Math.floor(currentFloorScore / 100);
    if (milestone > this.lastScoreMilestone) {
      this.lastScoreMilestone = milestone;
      soundManager.playScore();
    }

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

  private startScreenShake() {
    this.shakeTimer = CONFIG.shakeDuration;
  }

  private triggerGameOver(engine: Engine) {
    this.isGameOver = true;
    soundManager.playGameOver();
    this.startScreenShake();
    // Store score for game over screen
    (engine as any).lastScore = Math.floor(this.score);
    // Delay scene transition slightly so shake is visible
    setTimeout(() => {
      engine.goToScene('gameover');
    }, CONFIG.shakeDuration);
  }

  getCurrentScore() {
    return Math.floor(this.score);
  }
}
