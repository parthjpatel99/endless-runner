import { Engine, Scene, Color, DisplayMode } from 'excalibur';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BACKGROUND } from './config.ts';

// --------------- Placeholder scene ---------------
class GameScene extends Scene {
  override onInitialize(_engine: Engine): void {
    // TODO: add player, obstacles, and score label in future tasks
    console.log('GameScene initialized — ready to build!');
  }
}

// --------------- Engine setup ---------------
const game = new Engine({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex(COLOR_BACKGROUND),
  scenes: { game: GameScene },
});

// Start the game
game.start('game').catch((err: unknown) => {
  console.error('Failed to start game:', err);
});
