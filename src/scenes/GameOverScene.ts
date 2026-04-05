import { Scene, Engine, Color, vec, Font, Label, Keys, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';
import { GameScene } from './GameScene';
import { submitHighScore } from '../api/highscore';
import { showNameInput } from '../ui/NameInputOverlay';

export class GameOverScene extends Scene {
  private scoreLabel!: Label;
  private bestScoreLabel!: Label;
  private newBestLabel!: Label;
  private blinkTimer = 0;
  private promptLabel!: Label;
  private worldRecordLabel!: Label;
  private newRecordLabel!: Label;
  private coffeeLabel!: Label;
  private coffeeLabelLine2!: Label;
  private canRestart = false;

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
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 55),
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

    // World record display
    this.worldRecordLabel = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 75),
      font: new Font({
        size: 12,
        color: Color.fromHex('#2a8a7e'),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.add(this.worldRecordLabel);

    // NEW WORLD RECORD banner (hidden by default)
    this.newRecordLabel = new Label({
      text: '★  NEW WORLD RECORD  ★',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 55),
      font: new Font({
        size: 16,
        bold: true,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.newRecordLabel.graphics.opacity = 0;
    this.add(this.newRecordLabel);

    // Coffee banner line 1 (hidden by default)
    this.coffeeLabel = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 95),
      font: new Font({
        size: 11,
        bold: true,
        color: Color.White,
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.coffeeLabel.graphics.opacity = 0;
    this.add(this.coffeeLabel);

    // Coffee banner line 2 — email address
    this.coffeeLabelLine2 = new Label({
      text: '',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 112),
      font: new Font({
        size: 11,
        color: Color.fromHex(CONFIG.globalRecordColor),
        family: '"Orbitron", monospace',
        textAlign: TextAlign.Center,
      }),
      z: 10,
    });
    this.coffeeLabelLine2.graphics.opacity = 0;
    this.add(this.coffeeLabelLine2);

    // Restart prompt
    this.promptLabel = new Label({
      text: 'PRESS  SPACE  TO  RESTART',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 140),
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
    const lastScore = GameScene.lastScore;
    const prevBest = parseInt(localStorage.getItem('neonRunnerBest') || '0', 10);
    const isNewBest = lastScore > prevBest;

    if (isNewBest) {
      localStorage.setItem('neonRunnerBest', String(lastScore));
    }

    const displayBest = Math.max(lastScore, prevBest);
    const globalRecord = GameScene.globalRecord;
    const isNewWorldRecord = lastScore > globalRecord.score;

    // Update labels
    this.scoreLabel.text = `SCORE  ${lastScore}`;
    this.bestScoreLabel.text = `BEST  ${displayBest}`;

    // Reset all optional labels
    this.newBestLabel.graphics.opacity = 0;
    this.newRecordLabel.graphics.opacity = 0;
    this.coffeeLabel.graphics.opacity = 0;
    this.coffeeLabelLine2.graphics.opacity = 0;
    this.canRestart = true;

    if (isNewWorldRecord) {
      // Show new world record badge (replaces new best badge)
      this.newRecordLabel.graphics.opacity = 1;
      this.worldRecordLabel.text = '';

      // Block restart while name input is showing
      this.canRestart = false;

      // Show name input, submit, then show coffee banner
      showNameInput().then((name) => {
        submitHighScore(lastScore, name).then((confirmed) => {
          if (confirmed) {
            this.coffeeLabel.text = "You're #1! Email me to claim a coffee:";
            this.coffeeLabelLine2.text = 'parth8199@gmail.com';
            this.coffeeLabel.graphics.opacity = 1;
            this.coffeeLabelLine2.graphics.opacity = 1;
            // Update the cached global record
            GameScene.globalRecord = { score: lastScore, holder: name };
          }
          this.canRestart = true;
        });
      });
    } else if (isNewBest) {
      this.newBestLabel.graphics.opacity = 1;
      this.worldRecordLabel.text = globalRecord.score > 0
        ? `WORLD RECORD  ${globalRecord.score} by ${globalRecord.holder}`
        : '';
    } else {
      this.worldRecordLabel.text = globalRecord.score > 0
        ? `WORLD RECORD  ${globalRecord.score} by ${globalRecord.holder}`
        : '';
    }

    this.blinkTimer = 0;
  }

  onPreUpdate(engine: Engine, delta: number) {
    // Blink the restart prompt
    this.blinkTimer += delta;
    if (this.promptLabel) {
      this.promptLabel.graphics.opacity = Math.sin(this.blinkTimer / 450) > 0 ? 1 : 0.2;
    }

    if (!this.canRestart) return;

    if (
      engine.input.keyboard.wasPressed(Keys.Space) ||
      engine.input.keyboard.wasPressed(Keys.Enter)
    ) {
      engine.goToScene('game');
    }
  }
}
