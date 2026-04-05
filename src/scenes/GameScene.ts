import { Scene, Engine, Color, vec, Font, Label, TextAlign, Actor, CollisionType } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { Player } from '../actors/Player';
import { Ground } from '../actors/Ground';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { ParallaxLayer } from '../actors/ParallaxBackground';
import { soundManager } from '../audio/SoundManager';
import { fetchGlobalHighScore } from '../api/highscore';
import type { GlobalHighScore } from '../api/highscore';

export class GameScene extends Scene {
  static lastScore = 0;
  static globalRecord: GlobalHighScore = { score: 0, holder: '' };

  private player!: Player;
  private ground!: Ground;
  private spawner!: ObstacleSpawner;
  private score = 0;
  private currentSpeed = CONFIG.initialSpeed;
  private speedTimer = 0;
  private scoreLabel!: Label;
  private bestScoreLabel!: Label;
  private worldRecordLabel!: Label;
  private isGameOver = false;
  private initialized = false;
  private parallaxLayers: ParallaxLayer[] = [];
  private shakeTimer = 0;
  private lastScoreMilestone = 0;
  private displayedScore = -1;
  private sceneTransitionTimer = 0;

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

    // Neon glow line at ground surface
    const groundLine = new Actor({
      x: CONFIG.width / 2,
      y: CONFIG.groundY,
      width: CONFIG.width * 3,
      height: 2,
      color: Color.fromHex(CONFIG.groundLineColor),
      collisionType: CollisionType.PreventCollision,
      z: 2,
    });
    this.add(groundLine);

    this.player = new Player();
    this.add(this.player);

    this.spawner = new ObstacleSpawner(this);
  }

  private setupUI(_engine: Engine) {
    this.scoreLabel = new Label({
      text: '0',
      pos: vec(CONFIG.width / 2, 28),
      font: new Font({
        size: 26,
        bold: true,
        color: Color.fromHex(CONFIG.uiColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.scoreLabel);

    const bestScore = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
    this.bestScoreLabel = new Label({
      text: `BEST  ${bestScore}`,
      pos: vec(CONFIG.width - 16, 28),
      font: new Font({
        size: 14,
        color: Color.fromHex('#2a8a7e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Right,
      }),
      z: 10,
    });
    this.add(this.bestScoreLabel);

    this.worldRecordLabel = new Label({
      text: 'WORLD RECORD  ---',
      pos: vec(CONFIG.width - 16, 48),
      font: new Font({
        size: 12,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Right,
      }),
      z: 10,
    });
    this.add(this.worldRecordLabel);
  }

  onActivate(_ctx: SceneActivationContext) {
    // Reset game state when scene activates
    this.score = 0;
    this.currentSpeed = CONFIG.initialSpeed;
    this.speedTimer = 0;
    this.isGameOver = false;
    this.shakeTimer = 0;
    this.lastScoreMilestone = 0;
    this.displayedScore = -1;
    this.sceneTransitionTimer = 0;

    if (this.initialized && this.spawner) {
      this.spawner.reset();
    }

    // Reset player position and state
    if (this.initialized && this.player) {
      this.player.pos.x = CONFIG.playerX;
      this.player.pos.y = CONFIG.groundY - CONFIG.playerHeight / 2;
      this.player.reset();
    }

    if (this.initialized && this.scoreLabel) {
      this.scoreLabel.text = '0';
    }

    if (this.initialized && this.bestScoreLabel) {
      const bestScore = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
      this.bestScoreLabel.text = `BEST  ${bestScore}`;
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

    // Fetch global high score (non-blocking)
    fetchGlobalHighScore().then((record) => {
      GameScene.globalRecord = record;
      if (this.worldRecordLabel) {
        this.worldRecordLabel.text = record.score > 0
          ? `WORLD RECORD  ${record.score} by ${record.holder}`
          : 'WORLD RECORD  ---';
      }
    });
  }

  onPreUpdate(engine: Engine, delta: number) {
    // Handle screen shake regardless of game over state
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      if (this.shakeTimer <= 0) {
        this.camera.pos.x = CONFIG.width / 2;
        this.camera.pos.y = CONFIG.height / 2;
      } else {
        const progress = this.shakeTimer / CONFIG.shakeDuration;
        const intensity = CONFIG.shakeIntensity * progress;
        this.camera.pos.x = CONFIG.width / 2 + (Math.random() - 0.5) * 2 * intensity;
        this.camera.pos.y = CONFIG.height / 2 + (Math.random() - 0.5) * 2 * intensity;
      }
    }

    // Game-time based scene transition (replaces setTimeout)
    if (this.sceneTransitionTimer > 0) {
      this.sceneTransitionTimer -= delta;
      if (this.sceneTransitionTimer <= 0) {
        engine.goToScene('gameover');
      }
    }

    if (this.isGameOver) return;

    // Update parallax layers
    for (const layer of this.parallaxLayers) {
      layer.update(this.currentSpeed, delta);
    }

    // Update score
    this.score += (CONFIG.scorePerSecond * delta) / 1000;
    const currentFloorScore = Math.floor(this.score);
    if (currentFloorScore !== this.displayedScore) {
      this.displayedScore = currentFloorScore;
      this.scoreLabel.text = `${currentFloorScore}`;
    }

    // Play score milestone sound every 100 points
    const milestone = Math.floor(currentFloorScore / 100);
    if (milestone > this.lastScoreMilestone) {
      this.lastScoreMilestone = milestone;
      soundManager.playScore();
    }

    // Update speed
    this.speedTimer += delta / 1000;
    if (this.speedTimer >= CONFIG.speedInterval) {
      this.speedTimer -= CONFIG.speedInterval;
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

  private triggerGameOver(_engine: Engine) {
    this.isGameOver = true;
    soundManager.playGameOver();
    this.startScreenShake();

    // Freeze all obstacles and player in place
    for (const obs of this.spawner.getObstacles()) {
      obs.vel.x = 0;
    }
    this.player.vel.x = 0;
    this.player.vel.y = 0;

    // Store score for game over screen
    GameScene.lastScore = Math.floor(this.score);

    // Transition after shake completes (game-time, not wall-clock)
    this.sceneTransitionTimer = CONFIG.shakeDuration;
  }

  getCurrentScore() {
    return Math.floor(this.score);
  }
}
