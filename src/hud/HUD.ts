import * as THREE from 'three';

export class HUD {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    console.log(`XP: ${totalXp} | Blocks: ${blocksPlaced}/${totalSlots}`);
  }

  showActivityText(label: string, xpEarned: number): void {
    console.log(`+${xpEarned} XP: ${label}`);
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    console.log(`Session ${name}: ${status}`);
  }

  update(delta: number): void {
    // Will animate floating text etc.
  }
}
