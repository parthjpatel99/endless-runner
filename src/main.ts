import { Engine, DisplayMode, Color, vec } from 'excalibur';
import { CONFIG } from './config';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

// Prevent browser from scrolling on Space/Arrow keys used for gameplay
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
}, { passive: false });

const game = new Engine({
  width: CONFIG.width,
  height: CONFIG.height,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex(CONFIG.backgroundColor),
  antialiasing: false,
  suppressPlayButton: true,
  physics: {
    gravity: vec(0, CONFIG.gravity),
  },
});

game.add('game', new GameScene());
game.add('gameover', new GameOverScene());

game.start().then(() => {
  game.goToScene('game');
  // Ensure canvas has keyboard focus
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }
});
