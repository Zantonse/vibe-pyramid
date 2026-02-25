import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostProcessing {
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    // Create composer
    this.composer = new EffectComposer(renderer);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Unreal bloom pass — half resolution for performance
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.4,   // strength
      0.5,   // radius
      0.85   // threshold (raised to limit bloom to brightest emissives)
    );
    this.bloomPass = bloomPass;
    this.composer.addPass(bloomPass);

    // Output pass
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  setMilestoneLevel(level: number): void {
    // Scale bloom strength from 0.2 at level 0 to ~0.6 at level 8+
    const normalizedLevel = Math.min(level, 8);
    const strength = 0.2 + (normalizedLevel / 8) * 0.4;
    this.bloomPass.strength = strength;
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width / 2, height / 2);
  }

  render(): void {
    this.composer.render();
  }
}
