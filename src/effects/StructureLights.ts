import * as THREE from 'three';

interface StructureLight {
  light: THREE.PointLight;
  structureId: string;
  baseIntensity: number;
  behavior: 'flicker' | 'pulse' | 'beacon' | 'static';
  basePosition: THREE.Vector3; // original position for beacon orbit
  angle: number; // for beacon rotation
}

export class StructureLights {
  private scene: THREE.Scene;
  private lights: StructureLight[] = [];
  private activeStructures = new Set<string>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  notifyStructureBuilt(structureId: string, worldOffset: THREE.Vector3): void {
    // Use a unique key to prevent duplicate lights per structure instance.
    // For structures that can be built multiple times (e.g. altar, worker-village),
    // the key includes the world position so each placement gets its own lights.
    const instanceKey = `${structureId}@${worldOffset.x.toFixed(1)},${worldOffset.y.toFixed(1)},${worldOffset.z.toFixed(1)}`;
    if (this.activeStructures.has(instanceKey)) return;

    const addLight = (
      color: number,
      intensity: number,
      distance: number,
      decay: number,
      behavior: StructureLight['behavior'],
      offset: THREE.Vector3,
    ): void => {
      const light = new THREE.PointLight(color, intensity, distance, decay);
      const pos = worldOffset.clone().add(offset);
      light.position.copy(pos);
      this.scene.add(light);

      this.lights.push({
        light,
        structureId,
        baseIntensity: intensity,
        behavior,
        basePosition: pos.clone(),
        angle: 0,
      });
    };

    switch (structureId) {
      case 'altar': {
        // 4 corner lights
        const corners = [
          new THREE.Vector3(-1, 3.5, -1),
          new THREE.Vector3(-1, 3.5,  1),
          new THREE.Vector3( 1, 3.5, -1),
          new THREE.Vector3( 1, 3.5,  1),
        ];
        for (const corner of corners) {
          addLight(0xff6600, 1.0, 8, 2, 'flicker', corner);
        }
        break;
      }

      case 'sacred-lake':
        addLight(0x00bcd4, 0.8, 12, 2, 'pulse', new THREE.Vector3(0, 0.5, 0));
        break;

      case 'pharaoh-palace':
        // Warm glow from courtyard and entrance
        addLight(0xffab40, 0.8, 10, 2, 'flicker', new THREE.Vector3(0, 2, -3));
        addLight(0xffcc80, 0.5, 6, 2, 'static', new THREE.Vector3(0, 1.5, 2));
        break;

      case 'government-hall':
        // Grand beacon atop the hall
        addLight(0xffd54f, 1.5, 15, 1.5, 'beacon', new THREE.Vector3(0, 5, 0));
        break;

      case 'temple':
        addLight(0xffab40, 0.5, 6, 2, 'static', new THREE.Vector3(0, 2, 0));
        break;

      case 'valley-temple':
        addLight(0xffab40, 0.4, 5, 2, 'static', new THREE.Vector3(0, 1.5, 0));
        break;

      case 'worker-hovels': {
        // Dim lights in each hut
        const huts = [
          new THREE.Vector3(-2.6, 1, -2.6),
          new THREE.Vector3( 2.6, 1, -2.1),
          new THREE.Vector3(-2.1, 1,  2.6),
          new THREE.Vector3( 3.2, 1,  3.2),
        ];
        for (const hut of huts) {
          addLight(0xffcc80, 0.25, 3, 2, 'static', hut);
        }
        break;
      }

      case 'noble-villa':
        addLight(0xffab40, 0.6, 7, 2, 'flicker', new THREE.Vector3(0, 1.5, 0));
        break;

      case 'grand-bazaar': {
        // Lanterns along the central walkway
        addLight(0xff8c00, 0.5, 5, 2, 'flicker', new THREE.Vector3(-3, 2, 0));
        addLight(0xff8c00, 0.5, 5, 2, 'flicker', new THREE.Vector3(3, 2, 0));
        break;
      }

      case 'shrine-of-anubis':
        addLight(0xffab40, 0.5, 6, 2, 'static', new THREE.Vector3(0, 2, 0));
        break;

      default:
        // Most structures don't get lights — do nothing.
        return;
    }

    this.activeStructures.add(instanceKey);
  }

  update(delta: number, dayTime: number): void {
    // dayTime cycles 0→1; dayFactor peaks at 1.0 at noon (dayTime=0.5)
    const dayFactor = Math.sin(dayTime * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const intensityMult = 0.3 + (1.0 - dayFactor) * 0.7; // brightest at midnight

    for (const sl of this.lights) {
      switch (sl.behavior) {
        case 'flicker':
          sl.light.intensity = sl.baseIntensity * intensityMult * (0.7 + Math.random() * 0.6);
          break;

        case 'pulse':
          sl.light.intensity =
            sl.baseIntensity * intensityMult * (0.8 + Math.sin(Date.now() * 0.002) * 0.2);
          break;

        case 'beacon':
          sl.angle += delta * 1.5;
          // Orbit around the base position
          sl.light.position.x = sl.basePosition.x + Math.cos(sl.angle) * 2;
          sl.light.position.z = sl.basePosition.z + Math.sin(sl.angle) * 2;
          sl.light.intensity = sl.baseIntensity * intensityMult;
          break;

        case 'static':
          sl.light.intensity = sl.baseIntensity * intensityMult;
          break;
      }
    }
  }
}
