import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';
import { ProceduralWorker } from './ProceduralWorker.js';
import { ProceduralPharaoh } from './ProceduralPharaoh.js';

export interface SessionCharacters {
  pharaoh: CharacterModel;
  worker: CharacterModel;
}

export class CharacterFactory {
  private scene: THREE.Scene;
  private sessions: Map<string, SessionCharacters> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  getOrCreate(sessionId: string): SessionCharacters {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const worker = new ProceduralWorker();
    const pharaoh = new ProceduralPharaoh();

    const index = this.sessions.size;
    const baseX = -15;
    const baseZ = 5 + index * 4;

    worker.setPosition(new THREE.Vector3(baseX, 0, baseZ));
    pharaoh.setPosition(new THREE.Vector3(baseX - 2, 0, baseZ));
    pharaoh.lookAt(new THREE.Vector3(baseX, 0, baseZ));

    this.scene.add(worker.mesh);
    this.scene.add(pharaoh.mesh);

    const chars = { pharaoh, worker };
    this.sessions.set(sessionId, chars);
    return chars;
  }

  remove(sessionId: string): void {
    const chars = this.sessions.get(sessionId);
    if (chars) {
      this.scene.remove(chars.worker.mesh);
      this.scene.remove(chars.pharaoh.mesh);
      chars.worker.dispose();
      chars.pharaoh.dispose();
      this.sessions.delete(sessionId);
    }
  }

  update(delta: number): void {
    for (const { pharaoh, worker } of this.sessions.values()) {
      pharaoh.update(delta);
      worker.update(delta);
    }
  }

  getAllSessions(): Map<string, SessionCharacters> {
    return this.sessions;
  }
}
