import GUI from 'lil-gui';
import type { PostProcessing } from './PostProcessing.js';
import type { SceneManager } from '../scene/SceneManager.js';

export class DebugPanel {
  private gui: GUI;

  constructor(postProcessing: PostProcessing, sceneManager: SceneManager) {
    this.gui = new GUI({ title: 'Debug' });

    // Bloom controls
    const bloom = this.gui.addFolder('Bloom');
    bloom.add(postProcessing, 'enabled').name('Enabled');
    bloom.add(postProcessing, 'bloomIntensity', 0, 2, 0.01).name('Intensity');
    bloom.add(postProcessing, 'bloomThreshold', 0, 1, 0.01).name('Threshold');

    // Day/Night cycle
    const dayNight = this.gui.addFolder('Day/Night');
    dayNight.add(sceneManager, 'dayNightCycleDuration', 10, 600, 1).name('Cycle (s)');
  }

  dispose(): void {
    this.gui.destroy();
  }
}
