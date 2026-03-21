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
      this.timeUntilNextSpawn =
        CONFIG.minObstacleGap +
        Math.random() * (CONFIG.maxObstacleGap - CONFIG.minObstacleGap);
    }

    // Move obstacles and remove off-screen ones
    for (const obs of this.obstacles) {
      obs.vel.x = -currentSpeed;
    }

    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.pos.x < -100) {
        obs.kill();
        return false;
      }
      return true;
    });
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
