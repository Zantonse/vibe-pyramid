import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';
import { ProceduralWorker } from './ProceduralWorker.js';
import { ProceduralPharaoh } from './ProceduralPharaoh.js';
import { SessionController } from './SessionController.js';

export interface SessionCharacters {
  pharaoh: CharacterModel;
  worker: CharacterModel;
  controller: SessionController;
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
    const controller = new SessionController(worker, pharaoh, index);

    this.scene.add(worker.mesh);
    this.scene.add(pharaoh.mesh);

    const chars = { pharaoh, worker, controller };
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
    for (const { pharaoh, worker, controller } of this.sessions.values()) {
      controller.update(delta);
      pharaoh.update(delta);
      worker.update(delta);
    }
  }

  getAllSessions(): Map<string, SessionCharacters> {
    return this.sessions;
  }
}
