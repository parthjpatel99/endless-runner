import { Scene, Engine, Color, vec, Font, Label, Keys, TextAlign } from 'excalibur';
import type { SceneActivationContext } from 'excalibur';
import { CONFIG } from '../config';

export class GameOverScene extends Scene {
  private scoreLabel!: Label;

  onInitialize(_engine: Engine) {
    // Game Over title
    const titleLabel = new Label({
      text: 'GAME OVER',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 - 60),
      font: new Font({
        size: 48,
        bold: true,
        color: Color.fromHex(CONFIG.gameOverColor),
        family: 'monospace',
        textAlign: TextAlign.Center,
      }),
    });
    this.add(titleLabel);

    // Score label
    this.scoreLabel = new Label({
      text: 'Score: 0',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2),
      font: new Font({
        size: 24,
        color: Color.White,
        family: 'monospace',
        textAlign: TextAlign.Center,
      }),
    });
    this.add(this.scoreLabel);

    // Restart prompt
    const restartLabel = new Label({
      text: 'Press SPACE or ENTER to restart',
      pos: vec(CONFIG.width / 2, CONFIG.height / 2 + 60),
      font: new Font({
        size: 20,
        color: Color.White,
        family: 'monospace',
        textAlign: TextAlign.Center,
      }),
    });
    this.add(restartLabel);
  }

  onActivate(ctx: SceneActivationContext) {
    const engine = ctx.engine;
    if (engine) {
      const lastScore = (engine as any).lastScore || 0;
      if (this.scoreLabel) {
        this.scoreLabel.text = `Score: ${lastScore}`;
      }
    }
  }

  onPreUpdate(engine: Engine, _delta: number) {
    if (
      engine.input.keyboard.wasPressed(Keys.Space) ||
      engine.input.keyboard.wasPressed(Keys.Enter)
    ) {
      engine.goToScene('game');
    }
  }
}
