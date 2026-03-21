# Endless Runner

A browser-based arcade game built with [Excalibur.js](https://excaliburjs.com). Jump over obstacles, survive as long as possible, and chase a high score as the world accelerates around you.

![Game Preview](https://img.shields.io/badge/built%20with-Excalibur.js-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6) ![Vite](https://img.shields.io/badge/Vite-8.0-646cff)

---

## Gameplay

- **Jump** over incoming obstacles using `Space` or `↑`
- Speed increases every 3 seconds — survive as long as you can
- Score accumulates over time; every 100 points triggers an audio cue
- Hit an obstacle → screen shake, game over, restart with `Space` or `Enter`

---

## Tech Stack

| Tool | Role |
|------|------|
| [Excalibur.js](https://excaliburjs.com) v0.32 | 2D game engine (actors, physics, scenes, input) |
| TypeScript 5.9 | Type-safe game logic |
| Vite 8 | Dev server + production build |
| Vitest 4 | Unit tests |
| Web Audio API | Synthesized sound effects (no audio assets) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Commands

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
npm test         # run unit tests
```

---

## Project Structure

```
src/
├── main.ts                    # Engine init, scene registration
├── config.ts                  # All game constants (speeds, colors, physics)
├── actors/
│   ├── Player.ts              # Jump mechanics, ground detection, input cooldown
│   ├── Obstacle.ts            # Randomly-sized obstacles
│   ├── Ground.ts              # Static collision platform
│   └── ParallaxBackground.ts  # 3-layer depth scrolling
├── scenes/
│   ├── GameScene.ts           # Main loop: score, speed scaling, collision
│   └── GameOverScene.ts       # End screen + restart listener
├── systems/
│   └── ObstacleSpawner.ts     # Procedural spawning with random gaps
└── audio/
    └── SoundManager.ts        # Synthesized jump / game-over / score sounds
```

---

## Configuration

All tunable constants live in [`src/config.ts`](src/config.ts):

| Constant | Default | Description |
|----------|---------|-------------|
| `initialSpeed` | `300` px/s | Starting scroll speed |
| `maxSpeed` | `800` px/s | Speed cap |
| `speedIncrement` | `+20` | Added every 3 seconds |
| `jumpForce` | `-700` | Upward velocity on jump |
| `gravity` | `1800` | Downward acceleration |
| `minObstacleGap` | `300` px | Minimum gap between obstacles |
| `maxObstacleGap` | `600` px | Maximum gap between obstacles |

---

## License

MIT
