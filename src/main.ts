import { SceneManager } from './scene/SceneManager.js';
import { PyramidBuilder } from './pyramid/PyramidBuilder.js';
import { CharacterFactory } from './characters/CharacterFactory.js';
import { HUD } from './hud/HUD.js';
import { WSClient } from './network/WSClient.js';
import { EventRouter } from './events/EventRouter.js';
import { SandParticles } from './effects/SandParticles.js';
import { Sidebar } from './ui/Sidebar.js';
import { BlockAudio } from './audio/BlockAudio.js';

// Core systems
const sceneManager = new SceneManager();
const pyramid = new PyramidBuilder(sceneManager.scene);
const characters = new CharacterFactory(sceneManager.scene);
const hud = new HUD();
const sand = new SandParticles(sceneManager.scene);
const sidebar = new Sidebar();
const audio = new BlockAudio();
pyramid.onBlockLand(() => audio.playBlockLand());
hud.onLevelUp(() => audio.playLevelUp());

// Networking
const ws = new WSClient();
const router = new EventRouter(characters, pyramid, hud, sidebar, sceneManager);
ws.onMessage((msg) => router.handle(msg));

// Render loop
let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  pyramid.update(delta);
  characters.update(delta);
  hud.update(delta);
  sand.update(delta);
  sceneManager.update(delta);
  sceneManager.render();
}

animate();
