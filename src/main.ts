import { Engine, DisplayMode, Color, PointerScope, vec } from 'excalibur';
import { CONFIG } from './config';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

// Prevent browser from scrolling on Space/Arrow keys used for gameplay
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
}, { passive: false });

// Pre-load the UI fonts so canvas text uses them from the first frame
document.fonts.load('24px "IBM Plex Mono"').catch(() => {});
document.fonts.load('72px "Instrument Serif"').catch(() => {});

const game = new Engine({
  width: CONFIG.width,
  height: CONFIG.height,
  displayMode: DisplayMode.FitScreenAndFill,
  backgroundColor: Color.fromHex(CONFIG.backgroundColor),
  antialiasing: false,
  suppressPlayButton: true,
  // Only taps on the game itself count — not taps on the name-entry overlay
  pointerScope: PointerScope.Canvas,
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
