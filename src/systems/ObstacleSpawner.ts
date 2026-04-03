import { Scene } from 'excalibur';
import { Obstacle } from '../actors/Obstacle';
import { CONFIG } from '../config';

export class ObstacleSpawner {
  private timeUntilNextSpawn: number;
  private scene: Scene;
  private obstacles: Obstacle[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.timeUntilNextSpawn = CONFIG.minObstacleGap;
  }

  update(delta: number, currentSpeed: number) {
    // Decrease the pixel-distance counter by how far we traveled this frame
    this.timeUntilNextSpawn -= (delta / 1000) * currentSpeed;

    if (this.timeUntilNextSpawn <= 0) {
      this.spawnObstacle(currentSpeed);
      // Scale gap with speed so obstacles stay clearable at high velocity
      const speedScale = (currentSpeed - CONFIG.initialSpeed) * 0.3;
      const minGap = CONFIG.minObstacleGap + speedScale;
      const maxGap = CONFIG.maxObstacleGap + speedScale;
      this.timeUntilNextSpawn = minGap + Math.random() * (maxGap - minGap);
    }

    // Move obstacles and remove off-screen ones (reverse iterate for safe in-place removal)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.vel.x = -currentSpeed;
      if (obs.pos.x < -100) {
        obs.kill();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private spawnObstacle(currentSpeed: number) {
    const height =
      CONFIG.obstacleMinHeight +
      Math.random() * (CONFIG.obstacleMaxHeight - CONFIG.obstacleMinHeight);
    const obstacle = new Obstacle(CONFIG.width + 50, height);
    obstacle.vel.x = -currentSpeed;
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  reset() {
    for (const obs of this.obstacles) {
      obs.kill();
    }
    this.obstacles = [];
    this.timeUntilNextSpawn = CONFIG.minObstacleGap;
  }
}
