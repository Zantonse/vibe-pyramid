import { SceneManager } from './scene/SceneManager.js';

const scene = new SceneManager();

let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  scene.update(delta);
  scene.render();
}

animate();
