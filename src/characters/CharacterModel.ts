import * as THREE from 'three';

export type AnimationName = 'idle' | 'walk' | 'whip' | 'carry' | 'chisel' | 'survey' | 'antenna' | 'portal';

export interface CharacterModel {
  mesh: THREE.Group;
  playAnimation(name: AnimationName): void;
  update(delta: number): void;
  setPosition(pos: THREE.Vector3): void;
  lookAt(target: THREE.Vector3): void;
  dispose(): void;
}
