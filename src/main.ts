import * as THREE from 'three';
import { MILESTONES } from '../shared/types.js';
import { SceneManager } from './scene/SceneManager.js';
import { BuildManager } from './structures/BuildManager.js';
import { CharacterFactory } from './characters/CharacterFactory.js';
import { HUD } from './hud/HUD.js';
import { WSClient } from './network/WSClient.js';
import { EventRouter } from './events/EventRouter.js';
import { SandParticles } from './effects/SandParticles.js';
import { Sidebar } from './ui/Sidebar.js';
import { BlockAudio } from './audio/BlockAudio.js';
import { PostProcessing } from './effects/PostProcessing.js';
import { NightSky } from './effects/NightSky.js';
import { Clouds } from './effects/Clouds.js';
import { TorchFire } from './effects/TorchFire.js';
import { WaterShader } from './effects/WaterShader.js';
import { BirdFlock } from './characters/BirdFlock.js';
import { CamelModel } from './characters/CamelModel.js';
import { DustBurst } from './effects/DustBurst.js';
import { AmbientAudio } from './audio/AmbientAudio.js';
import { AchievementToast } from './ui/AchievementToast.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { Minimap } from './ui/Minimap.js';

// Core systems
const sceneManager = new SceneManager();
const buildManager = new BuildManager(sceneManager.scene);
const characters = new CharacterFactory(sceneManager.scene);
const hud = new HUD();
const sand = new SandParticles(sceneManager.scene);
const sidebar = new Sidebar();
const audio = new BlockAudio();

// Post-processing
const postProcessing = new PostProcessing(sceneManager.renderer, sceneManager.scene, sceneManager.camera);

// Effects
const nightSky = new NightSky(sceneManager.scene);
const clouds = new Clouds(sceneManager.scene);
const torchFire = new TorchFire(sceneManager.scene);
const waterShader = new WaterShader(sceneManager.scene);
const dustBurst = new DustBurst(sceneManager.scene);

// Living world
const birdFlock = new BirdFlock(sceneManager.scene);
const camelModel = new CamelModel(sceneManager.scene);

// Ambient audio
const ambientAudio = new AmbientAudio();

// UI overlays
const achievementToast = new AchievementToast();
const statsPanel = new StatsPanel();
const minimap = new Minimap();

// Audio warmup on first click
document.addEventListener('click', () => {
  audio.warmup();
  ambientAudio.warmup();
}, { once: true });

// Block land callbacks — both audio and dust burst
buildManager.onBlockLand(() => {
  audio.playBlockLand();
  const pos = buildManager.getNextBlockPosition();
  if (pos) dustBurst.emit(pos);
});

// Level-up callbacks
let torchesAdded7 = false;
let torchesAdded9 = false;

hud.onLevelUp((_name, index) => {
  audio.playLevelUp(index);
  sceneManager.setMilestoneLevel(index);
  sand.setMilestoneLevel(index);
  postProcessing.setMilestoneLevel(index);

  // Add torches at milestone levels
  if (index >= 7 && !torchesAdded7) {
    torchesAdded7 = true;
    torchFire.addTorch(new THREE.Vector3(-1.5, 2.5, 11), 1.5);
    torchFire.addTorch(new THREE.Vector3(1.5, 2.5, 11), 1.5);
    ambientAudio.setTorchesActive(true);
  }
  if (index >= 9 && !torchesAdded9) {
    torchesAdded9 = true;
    torchFire.addTorch(new THREE.Vector3(-8, 2.5, -8), 1.2);
    torchFire.addTorch(new THREE.Vector3(8, 2.5, -8), 1.2);
    torchFire.addTorch(new THREE.Vector3(-8, 2.5, 8), 1.2);
    torchFire.addTorch(new THREE.Vector3(8, 2.5, 8), 1.2);
  }

  // Achievement toast
  const milestone = MILESTONES[index];
  if (milestone) {
    achievementToast.show(milestone.icon, milestone.name);
  }
});

// Resize hook
window.addEventListener('resize', () => {
  postProcessing.resize(window.innerWidth, window.innerHeight);
});

// Networking
const ws = new WSClient();
const router = new EventRouter(characters, buildManager, hud, sidebar, sceneManager, sand);
ws.onMessage((msg) => router.handle(msg));

// Render loop
let lastTime = performance.now();
let frameCount = 0;

function animate(): void {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  frameCount++;

  const dayTime = sceneManager.currentDayTime;

  // Core updates
  buildManager.update(delta);
  characters.update(delta);
  hud.update(delta);
  sand.update(delta);
  sceneManager.update(delta);

  // Effects
  nightSky.update(delta, dayTime);
  clouds.update(delta, dayTime);
  torchFire.update(delta);
  waterShader.update(delta, dayTime);
  dustBurst.update(delta);

  // Living world
  birdFlock.update(delta);
  camelModel.update(delta);

  // Ambient audio
  ambientAudio.update(delta);

  // UI updates (throttled)
  if (frameCount % 30 === 0) {
    const progress = buildManager.activeStructureProgress;
    statsPanel.update(
      0, // totalXp updated via HUD
      buildManager.totalPlacedCount,
      buildManager.totalSlots,
      buildManager.activeStructureName,
      progress
    );
  }
  if (frameCount % 60 === 0) {
    const pyramidProgress = buildManager.pyramidBuilder.currentPlacedCount / buildManager.pyramidBuilder.totalSlots;
    minimap.update(pyramidProgress, [
      { name: 'Great Pyramid', x: 0, z: 0, placed: buildManager.pyramidBuilder.currentPlacedCount, total: buildManager.pyramidBuilder.totalSlots },
      { name: 'Obelisk', x: 18, z: 15, placed: 0, total: 0 },
      { name: 'Sphinx', x: 0, z: 22, placed: 0, total: 0 },
      { name: 'Colonnade', x: 0, z: 14, placed: 0, total: 0 },
      { name: "Queen's Pyramid", x: -20, z: 8, placed: 0, total: 0 },
      { name: 'Solar Barque', x: 22, z: -8, placed: 0, total: 0 },
    ]);
  }

  // Render with post-processing instead of direct renderer
  postProcessing.render();
}

animate();
