export const CONFIG = {
  // Game
  width: 800,
  height: 400,
  backgroundColor: '#04040f',

  // Player
  playerX: 100,
  playerWidth: 38,
  playerHeight: 58,
  playerColor: '#00f5d4',
  jumpForce: -700,
  gravity: 1800,
  groundY: 340,  // Y position of ground surface (feet of player)

  // Obstacles
  obstacleWidth: 30,
  obstacleMinHeight: 40,
  obstacleMaxHeight: 120,
  obstacleColor: '#f72585',
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
  globalRecordColor: '#ffd60a',
  coffeeMessage: "You're #1! Email me at parth8199@gmail.com to claim a coffee",

  // Ground
  groundHeight: 18,
  groundColor: '#08081e',
  groundLineColor: '#00f5d4',

  // Parallax layers (background to foreground)
  parallaxLayers: [
    { color: '#0a1030', speedMultiplier: 0.1, count: 7, width: 2, minHeight: 25, maxHeight: 70, yBase: 210 },
    { color: '#111f48', speedMultiplier: 0.3, count: 5, width: 3, minHeight: 45, maxHeight: 110, yBase: 255 },
    { color: '#1e1256', speedMultiplier: 0.6, count: 4, width: 5, minHeight: 70, maxHeight: 150, yBase: 305 },
  ],

  // Screen shake
  shakeDuration: 300,
  shakeIntensity: 8,

  // Fonts and UI
  scoreFont: '22px "Orbitron", monospace',
  titleFont: 'bold 52px "Orbitron", monospace',
  subtitleFont: '16px "Orbitron", monospace',
  uiColor: '#00f5d4',
  gameOverColor: '#f72585',
};
