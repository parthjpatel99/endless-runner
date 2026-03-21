export const CONFIG = {
  // Game
  width: 800,
  height: 400,
  backgroundColor: '#1a1a2e',

  // Player
  playerX: 100,
  playerWidth: 40,
  playerHeight: 60,
  playerColor: '#e94560',
  jumpForce: -700,
  gravity: 1800,
  groundY: 340,  // Y position of ground surface (feet of player)

  // Obstacles
  obstacleWidth: 30,
  obstacleMinHeight: 40,
  obstacleMaxHeight: 120,
  obstacleColor: '#f5a623',
  minObstacleGap: 300,
  maxObstacleGap: 600,

  // Speed
  initialSpeed: 300,   // pixels per second
  maxSpeed: 800,
  speedIncrement: 20,  // added per second
  speedInterval: 3,    // seconds between speed increases

  // Score
  scorePerSecond: 10,

  // Ground
  groundHeight: 20,
  groundColor: '#16213e',
  groundLineColor: '#0f3460',

  // Parallax layers (background to foreground)
  parallaxLayers: [
    { color: '#16213e', speedMultiplier: 0.1, count: 6, width: 2, minHeight: 20, maxHeight: 60, yBase: 200 },
    { color: '#0f3460', speedMultiplier: 0.3, count: 4, width: 3, minHeight: 40, maxHeight: 100, yBase: 250 },
    { color: '#533483', speedMultiplier: 0.6, count: 3, width: 4, minHeight: 60, maxHeight: 140, yBase: 300 },
  ],

  // Screen shake
  shakeDuration: 300,
  shakeIntensity: 8,

  // Fonts and UI
  scoreFont: '24px monospace',
  titleFont: 'bold 48px monospace',
  subtitleFont: '20px monospace',
  uiColor: '#ffffff',
  gameOverColor: '#e94560',
};
