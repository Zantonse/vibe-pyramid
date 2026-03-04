import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

export class PostProcessing {
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private effectPass: EffectPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer, { multisampling: 4 });

    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomEffect = new BloomEffect({
      intensity: 0.4,
      luminanceThreshold: 0.85,
      radius: 0.5,
    });

    this.effectPass = new EffectPass(camera, this.bloomEffect);
    this.composer.addPass(this.effectPass);
  }

  setMilestoneLevel(level: number): void {
    const normalizedLevel = Math.min(level, 8);
    const strength = 0.2 + (normalizedLevel / 8) * 0.4;
    this.bloomEffect.intensity = strength;
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  render(): void {
    this.composer.render();
  }

  /** Enable or disable the entire post-processing effect pass. */
  setEnabled(enabled: boolean): void {
    this.effectPass.enabled = enabled;
  }

  get enabled(): boolean {
    return this.effectPass.enabled;
  }

  get bloomIntensity(): number {
    return this.bloomEffect.intensity;
  }

  set bloomIntensity(value: number) {
    this.bloomEffect.intensity = value;
  }

  get bloomThreshold(): number {
    return this.bloomEffect.luminanceMaterial.threshold;
  }

  set bloomThreshold(value: number) {
    this.bloomEffect.luminanceMaterial.threshold = value;
  }
}
