import { Scene, Engine, Color, vec, Font, Label, TextAlign, Actor, CollisionType, Circle, Keys } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG, PALETTE } from '../config';
import { Player } from '../actors/Player';
import { Ground } from '../actors/Ground';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { ParallaxLayer } from '../actors/ParallaxBackground';
import { soundManager } from '../audio/SoundManager';
import { fetchGlobalHighScore } from '../api/highscore';
import type { GlobalHighScore } from '../api/highscore';

export class GameScene extends Scene {
  static lastScore = 0;
  /** `null` until the leaderboard answers (or when it's unreachable) */
  static globalRecord: GlobalHighScore | null = null;
  /** The first run of a page load waits for input, so an embedded game doesn't die unattended */
  static hasStarted = false;

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
  private pebbles: Actor[] = [];
  private shakeTimer = 0;
  private lastScoreMilestone = 0;
  private displayedScore = -1;
  private sceneTransitionTimer = 0;
  private waitingToStart = false;
  private startLabel!: Label;
  private startBlink = 0;

  onInitialize(engine: Engine) {
    this.setupParallax();
    this.setupActors();
    this.setupUI(engine);
    this.initialized = true;
  }

  private setupParallax() {
    this.setupSky();
    this.parallaxLayers = [];
    CONFIG.parallaxLayers.forEach((layerConfig, index) => {
      // z-index: further layers behind
      this.parallaxLayers.push(new ParallaxLayer(this, layerConfig, -10 + index));
    });
  }

  /** Static dusk sky: a haze band and a big banded sun (matches the site's Recess art) */
  private setupSky() {
    const decor = (x: number, y: number, width: number, height: number, color: string, z: number) =>
      this.add(new Actor({ x, y, width, height, color: Color.fromHex(color), collisionType: CollisionType.PreventCollision, z }));

    decor(CONFIG.width / 2, 225, CONFIG.width * 3, 90, PALETTE.skyBand, -30);

    const sun = new Actor({ x: CONFIG.sunX, y: CONFIG.sunY, collisionType: CollisionType.PreventCollision, z: -25 });
    sun.graphics.use(new Circle({ radius: CONFIG.sunRadius, color: Color.fromHex(CONFIG.sunColor) }));
    this.add(sun);

    // Horizontal cut-outs across the lower half of the sun
    decor(CONFIG.sunX, CONFIG.sunY + 2, CONFIG.sunRadius * 2 + 4, 4, PALETTE.skyBand, -24);
    decor(CONFIG.sunX, CONFIG.sunY + 14, CONFIG.sunRadius * 2 + 4, 5, PALETTE.skyBand, -24);
    decor(CONFIG.sunX, CONFIG.sunY + 27, CONFIG.sunRadius * 2 + 4, 6, PALETTE.skyBand, -24);
  }

  /** Little dashes of darker sand that scroll with the ground */
  private setupPebbles() {
    this.pebbles = [];
    for (let i = 0; i < CONFIG.pebbleCount; i++) {
      const pebble = new Actor({
        x: Math.random() * CONFIG.width,
        y: CONFIG.groundY + 10 + Math.random() * (CONFIG.groundHeight - 18),
        width: 6 + Math.random() * 18,
        height: 3,
        color: Color.fromHex(CONFIG.pebbleColor),
        collisionType: CollisionType.PreventCollision,
        z: 1,
      });
      this.add(pebble);
      this.pebbles.push(pebble);
    }
  }

  private setupActors() {
    this.ground = new Ground();
    this.add(this.ground);

    this.setupPebbles();

    // Cream highlight along the ground surface
    const groundLine = new Actor({
      x: CONFIG.width / 2,
      y: CONFIG.groundY,
      width: CONFIG.width * 3,
      height: 4,
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
      pos: vec(CONFIG.width / 2, 32),
      font: new Font({
        size: 24,
        color: Color.fromHex(CONFIG.uiColor),
        family: CONFIG.monoFamily,
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.scoreLabel);

    const bestScore = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
    this.bestScoreLabel = new Label({
      text: `BEST  ${bestScore}`,
      pos: vec(CONFIG.width - 20, 30),
      font: new Font({
        size: 13,
        color: Color.fromHex(CONFIG.uiMutedColor),
        family: CONFIG.monoFamily,
        textAlign: TextAlign.Right,
      }),
      z: 10,
    });
    this.add(this.bestScoreLabel);

    this.worldRecordLabel = new Label({
      text: 'WORLD RECORD  ---',
      pos: vec(CONFIG.width - 20, 50),
      font: new Font({
        size: 11,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: CONFIG.monoFamily,
        textAlign: TextAlign.Right,
      }),
      z: 10,
    });
    this.add(this.worldRecordLabel);

    this.startLabel = new Label({
      text: 'PRESS  SPACE  OR  TAP  TO  START',
      pos: vec(CONFIG.width / 2, 120),
      font: new Font({
        size: 15,
        color: Color.fromHex(CONFIG.uiColor),
        family: CONFIG.monoFamily,
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.startLabel);
  }

  private startInputPressed(engine: Engine) {
    const kb = engine.input.keyboard;
    return (
      kb.wasPressed(Keys.Space) ||
      kb.wasPressed(Keys.Up) ||
      kb.wasPressed(Keys.ArrowUp) ||
      kb.wasPressed(Keys.Enter) ||
      engine.input.pointers.wasDown(0)
    );
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
    this.waitingToStart = !GameScene.hasStarted;
    this.startBlink = 0;
    if (this.startLabel) this.startLabel.graphics.opacity = this.waitingToStart ? 1 : 0;

    if (this.initialized && this.spawner) {
      this.spawner.reset();
    }

    // Reset player position and state
    if (this.initialized && this.player) {
      this.player.pos.x = CONFIG.playerX;
      this.player.pos.y = CONFIG.groundY - CONFIG.playerHeight / 2;
      this.player.reset();
    }
    if (this.player) this.player.frozen = this.waitingToStart;

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
        this.worldRecordLabel.text = GameScene.recordText(record);
      }
    });
  }

  static recordText(record: GlobalHighScore | null): string {
    if (record === null) return 'WORLD RECORD  OFFLINE';
    return record.score > 0 ? `WORLD RECORD  ${record.score} by ${record.holder}` : 'WORLD RECORD  ---';
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

    // Start screen: hold everything until the first jump
    if (this.waitingToStart) {
      this.startBlink += delta;
      this.startLabel.graphics.opacity = Math.sin(this.startBlink / 450) > 0 ? 1 : 0.25;
      if (this.startInputPressed(engine)) {
        this.waitingToStart = false;
        GameScene.hasStarted = true;
        this.startLabel.graphics.opacity = 0;
        this.player.frozen = false;
        this.player.reset(); // cooldown swallows the start press
      }
      return;
    }

    // Update parallax layers
    for (const layer of this.parallaxLayers) {
      layer.update(this.currentSpeed, delta);
    }

    // Pebbles move at ground speed and wrap
    const dx = (this.currentSpeed * delta) / 1000;
    for (const pebble of this.pebbles) {
      pebble.pos.x -= dx;
      if (pebble.pos.x < -20) pebble.pos.x = CONFIG.width + Math.random() * 60;
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
