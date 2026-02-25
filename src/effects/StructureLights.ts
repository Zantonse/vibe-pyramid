import * as THREE from 'three';

interface StructureGlow {
  mesh: THREE.Mesh;
  structureId: string;
  baseOpacity: number;
  behavior: 'flicker' | 'pulse' | 'beacon' | 'static';
  basePosition: THREE.Vector3;
  angle: number;
}

// Shared geometry and materials — one draw call per color variant
const glowGeo = new THREE.PlaneGeometry(1, 1);
const glowMaterials = new Map<number, THREE.MeshBasicMaterial>();

function getGlowMaterial(color: number): THREE.MeshBasicMaterial {
  const existing = glowMaterials.get(color);
  if (existing) return existing;
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  glowMaterials.set(color, mat);
  return mat;
}

export class StructureLights {
  private scene: THREE.Scene;
  private glows: StructureGlow[] = [];
  private activeStructures = new Set<string>();
  private elapsed = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  notifyStructureBuilt(structureId: string, worldOffset: THREE.Vector3): void {
    const instanceKey = `${structureId}@${worldOffset.x.toFixed(1)},${worldOffset.y.toFixed(1)},${worldOffset.z.toFixed(1)}`;
    if (this.activeStructures.has(instanceKey)) return;

    const addGlow = (
      color: number,
      opacity: number,
      scale: number,
      behavior: StructureGlow['behavior'],
      offset: THREE.Vector3,
    ): void => {
      const mat = getGlowMaterial(color);
      const mesh = new THREE.Mesh(glowGeo, mat.clone());
      mesh.material.opacity = opacity;
      const pos = worldOffset.clone().add(offset);
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale);
      this.scene.add(mesh);

      this.glows.push({
        mesh,
        structureId,
        baseOpacity: opacity,
        behavior,
        basePosition: pos.clone(),
        angle: 0,
      });
    };

    switch (structureId) {
      case 'altar': {
        const corners = [
          new THREE.Vector3(-1, 3.5, -1),
          new THREE.Vector3(-1, 3.5,  1),
          new THREE.Vector3( 1, 3.5, -1),
          new THREE.Vector3( 1, 3.5,  1),
        ];
        for (const corner of corners) {
          addGlow(0xff6600, 0.7, 1.5, 'flicker', corner);
        }
        break;
      }

      case 'sacred-lake':
        addGlow(0x00bcd4, 0.5, 3.0, 'pulse', new THREE.Vector3(0, 0.5, 0));
        break;

      case 'pharaoh-palace':
        addGlow(0xffab40, 0.6, 2.0, 'flicker', new THREE.Vector3(0, 2, -3));
        addGlow(0xffcc80, 0.4, 1.5, 'static', new THREE.Vector3(0, 1.5, 2));
        break;

      case 'government-hall':
        addGlow(0xffd54f, 0.8, 3.0, 'beacon', new THREE.Vector3(0, 5, 0));
        break;

      case 'temple':
        addGlow(0xffab40, 0.4, 1.5, 'static', new THREE.Vector3(0, 2, 0));
        break;

      case 'valley-temple':
        addGlow(0xffab40, 0.3, 1.2, 'static', new THREE.Vector3(0, 1.5, 0));
        break;

      case 'worker-hovels': {
        const huts = [
          new THREE.Vector3(-2.6, 1, -2.6),
          new THREE.Vector3( 2.6, 1, -2.1),
          new THREE.Vector3(-2.1, 1,  2.6),
          new THREE.Vector3( 3.2, 1,  3.2),
        ];
        for (const hut of huts) {
          addGlow(0xffcc80, 0.25, 0.8, 'static', hut);
        }
        break;
      }

      case 'noble-villa':
        addGlow(0xffab40, 0.5, 1.8, 'flicker', new THREE.Vector3(0, 1.5, 0));
        break;

      case 'grand-bazaar':
        addGlow(0xff8c00, 0.5, 1.2, 'flicker', new THREE.Vector3(-3, 2, 0));
        addGlow(0xff8c00, 0.5, 1.2, 'flicker', new THREE.Vector3(3, 2, 0));
        break;

      case 'shrine-of-anubis':
        addGlow(0xffab40, 0.4, 1.5, 'static', new THREE.Vector3(0, 2, 0));
        break;

      default:
        return;
    }

    this.activeStructures.add(instanceKey);
  }

  update(delta: number, dayTime: number): void {
    this.elapsed += delta;

    // dayFactor peaks at 1.0 at noon (dayTime=0.5)
    const dayFactor = Math.sin(dayTime * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const intensityMult = 0.3 + (1.0 - dayFactor) * 0.7;

    for (const sg of this.glows) {
      const mat = sg.mesh.material as THREE.MeshBasicMaterial;

      switch (sg.behavior) {
        case 'flicker':
          mat.opacity = sg.baseOpacity * intensityMult * (0.7 + Math.random() * 0.6);
          break;

        case 'pulse':
          mat.opacity = sg.baseOpacity * intensityMult * (0.8 + Math.sin(this.elapsed * 2.0) * 0.2);
          break;

        case 'beacon':
          sg.angle += delta * 1.5;
          sg.mesh.position.x = sg.basePosition.x + Math.cos(sg.angle) * 2;
          sg.mesh.position.z = sg.basePosition.z + Math.sin(sg.angle) * 2;
          mat.opacity = sg.baseOpacity * intensityMult;
          break;

        case 'static':
          mat.opacity = sg.baseOpacity * intensityMult;
          break;
      }

      // Keep glow planes horizontal (light pool on ground/ceiling)
      sg.mesh.rotation.x = -Math.PI / 2;
    }
  }
}
