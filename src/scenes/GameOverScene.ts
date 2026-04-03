import { Scene, Engine, Color, vec, Font, Label, Keys, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { GameScene } from './GameScene';

export class GameOverScene extends Scene {
  private scoreLabel!: Label;
  private bestScoreLabel!: Label;
  private newBestLabel!: Label;
  private blinkTimer = 0;
  private promptLabel!: Label;

  onInitialize(_engine: Engine) {
    // GAME OVER title
    const titleLabel = new Label({
      text: 'GAME OVER',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 80),
      font: new Font({
        size: 52,
        bold: true,
        color: Color.fromHex(CONFIG.gameOverColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(titleLabel);

    // Divider label (decorative)
    const divLabel = new Label({
      text: '────────────────────',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 42),
      font: new Font({
        size: 12,
        color: Color.fromHex('#1e1e3e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(divLabel);

    // Score label
    this.scoreLabel = new Label({
      text: 'SCORE  0',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 10),
      font: new Font({
        size: 28,
        bold: true,
        color: Color.White,
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.scoreLabel);

    // Best score label
    this.bestScoreLabel = new Label({
      text: 'BEST  0',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 30),
      font: new Font({
        size: 16,
        color: Color.fromHex('#2a8a7e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.bestScoreLabel);

    // New best badge (hidden by default)
    this.newBestLabel = new Label({
      text: '★  NEW BEST  ★',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 58),
      font: new Font({
        size: 13,
        bold: true,
        color: Color.fromHex('#ffd60a'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.newBestLabel.graphics.opacity = 0;
    this.add(this.newBestLabel);

    // Restart prompt
    this.promptLabel = new Label({
      text: 'PRESS  SPACE  TO  RESTART',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 88),
      font: new Font({
        size: 14,
        color: Color.fromHex('#00f5d4'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.promptLabel);
  }

  onActivate(_ctx: SceneActivationContext) {
    {
      const lastScore = GameScene.lastScore;
      const prevBest = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
      const isNewBest = lastScore > prevBest;

      if (isNewBest) {
        localStorage.setItem('neonRunnerBest', String(lastScore));
      }

      const displayBest = Math.max(lastScore, prevBest);

      if (this.scoreLabel) {
        this.scoreLabel.text = `SCORE  ${lastScore}`;
      }
      if (this.bestScoreLabel) {
        this.bestScoreLabel.text = `BEST  ${displayBest}`;
      }
      if (this.newBestLabel) {
        this.newBestLabel.graphics.opacity = isNewBest ? 1 : 0;
      }
    }

    this.blinkTimer = 0;
  }

  onPreUpdate(engine: Engine, delta: number) {
    // Blink the restart prompt
    this.blinkTimer += delta;
    if (this.promptLabel) {
      this.promptLabel.graphics.opacity = Math.sin(this.blinkTimer / 450) > 0 ? 1 : 0.2;
    }

    if (
      engine.input.keyboard.wasPressed(Keys.Space) ||
      engine.input.keyboard.wasPressed(Keys.Enter)
    ) {
      engine.goToScene('game');
    }
  }
}
