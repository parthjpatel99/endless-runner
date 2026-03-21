// ============================================================
// Game Configuration — all tunable values live here
// ============================================================

// --------------- Game Dimensions ---------------
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 400;

// --------------- Player Settings ---------------
export const PLAYER_X = 100;           // fixed horizontal position
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const PLAYER_JUMP_FORCE = -600; // negative = upward velocity
export const PLAYER_GRAVITY = 1800;    // pixels per second squared

// --------------- Obstacle Settings ---------------
export const OBSTACLE_MIN_GAP = 250;       // min horizontal gap between obstacles (px)
export const OBSTACLE_MAX_GAP = 500;       // max horizontal gap between obstacles (px)
export const OBSTACLE_MIN_HEIGHT = 30;     // min obstacle height (px)
export const OBSTACLE_MAX_HEIGHT = 90;     // max obstacle height (px)
export const OBSTACLE_WIDTH = 30;
export const OBSTACLE_SPAWN_INTERVAL = 1.5; // seconds between spawn checks

// --------------- Speed Settings ---------------
export const INITIAL_SPEED = 300;      // pixels per second
export const MAX_SPEED = 800;          // pixels per second
export const ACCELERATION_RATE = 10;   // pixels per second, per second

// --------------- Score Settings ---------------
export const SCORE_MULTIPLIER = 0.01;  // score per pixel traveled

// --------------- Visual Settings ---------------
export const COLOR_BACKGROUND = '#1a1a2e';
export const COLOR_GROUND = '#4a4e69';
export const COLOR_PLAYER = '#e94560';
export const COLOR_OBSTACLE = '#f5a623';
export const COLOR_SCORE_TEXT = '#ffffff';

// Parallax layer scroll speed multipliers (relative to game speed)
export const PARALLAX_LAYER_SPEEDS = [0.1, 0.3, 0.6]; // far → near

// --------------- Audio Settings ---------------
export const VOLUME_MUSIC = 0.4;
export const VOLUME_SFX = 0.7;
