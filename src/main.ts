import { Engine, DisplayMode, Color, vec } from 'excalibur';
import { CONFIG } from './config';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const game = new Engine({
  width: CONFIG.width,
  height: CONFIG.height,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex(CONFIG.backgroundColor),
  antialiasing: false,
  physics: {
    gravity: vec(0, CONFIG.gravity),
  },
});

game.add('game', new GameScene());
game.add('gameover', new GameOverScene());

game.start().then(() => {
  game.goToScene('game');
});
