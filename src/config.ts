// Palette shared with parthjpatel.me ("Telemetry from the Sonoran desert")
export const PALETTE = {
  sky: '#2a211b',
  skyBand: '#3a2a20',
  sun: '#ff8a3d',
  ridgeFar: '#4a3326',
  ridgeMid: '#5b3a2a',
  ridgeNear: '#7a4a32',
  sand: '#c98a5a',
  sandDark: '#b0764a',
  cream: '#f1e9dc',
  ink: '#1a1714',
  saguaro: '#3f6b4a',
  saguaroDark: '#325a3c',
  muted: '#bdb1a1',
  gold: '#ffc15e',
};

export const CONFIG = {
  // Game
  width: 800,
  height: 400,
  backgroundColor: PALETTE.sky,

  // Player
  playerX: 100,
  playerWidth: 38,
  playerHeight: 58,
  playerColor: PALETTE.cream,
  playerEyeColor: PALETTE.ink,
  playerStrideMs: 110, // time per leg frame while running
  jumpForce: -700,
  gravity: 1800,
  groundY: 340,  // Y position of ground surface (feet of player)

  // Obstacles (saguaros — the trunk is the hitbox, arms are cosmetic)
  obstacleWidth: 30,
  obstacleMinHeight: 40,
  obstacleMaxHeight: 120,
  obstacleColor: PALETTE.saguaro,
  obstacleRibColor: PALETTE.saguaroDark,
  obstacleArmMinHeight: 64, // shorter cacti have no arms
  minObstacleGap: 300,
  maxObstacleGap: 600,

  // Speed
  initialSpeed: 300,   // pixels per second
  maxSpeed: 800,
  speedIncrement: 20,  // added per second
  speedInterval: 3,    // seconds between speed increases

  // Score
  scorePerSecond: 10,
  maxSubmittableScore: 10000,
  globalRecordColor: PALETTE.gold,
  coffeeMessage: "You're #1! Email me at parth8199@gmail.com to claim a coffee",

  // Ground (fills the canvas below the running surface)
  groundHeight: 60,
  groundColor: PALETTE.sand,
  groundLineColor: PALETTE.cream,
  pebbleColor: PALETTE.sandDark,
  pebbleCount: 14,

  // Sun
  sunX: 560,
  sunY: 205,
  sunRadius: 62,
  sunColor: PALETTE.sun,

  // Parallax ridgelines (background to foreground)
  parallaxLayers: [
    { color: PALETTE.ridgeFar, speedMultiplier: 0.1, count: 5, minWidth: 220, maxWidth: 340, minHeight: 50, maxHeight: 95, yBase: 262 },
    { color: PALETTE.ridgeMid, speedMultiplier: 0.3, count: 5, minWidth: 180, maxWidth: 300, minHeight: 45, maxHeight: 85, yBase: 300 },
    { color: PALETTE.ridgeNear, speedMultiplier: 0.6, count: 6, minWidth: 140, maxWidth: 240, minHeight: 30, maxHeight: 60, yBase: 342 },
  ],

  // Screen shake
  shakeDuration: 300,
  shakeIntensity: 8,

  // Fonts and UI
  monoFamily: '"IBM Plex Mono", ui-monospace, monospace',
  displayFamily: '"Instrument Serif", Georgia, serif',
  uiColor: PALETTE.cream,
  uiMutedColor: PALETTE.muted,
  accentColor: PALETTE.sun,
  gameOverColor: PALETTE.sun,
};
