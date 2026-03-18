import * as THREE from 'three';
import { getTerrainHeight } from '../scene/terrainHeight.js';

interface CamelConfig {
  position: THREE.Vector3;
  phase: number;
  facing: number;
}

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.85, metalness: 0.0 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x9a7a40, roughness: 0.9, metalness: 0.0 });
const hoofMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.7, metalness: 0.05 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.3, metalness: 0.1 });

class Camel {
  group: THREE.Group;
  config: CamelConfig;

  private head: THREE.Group;
  private neckPivot: THREE.Group;
  private legFL: THREE.Group;
  private legFR: THREE.Group;
  private legBL: THREE.Group;
  private legBR: THREE.Group;
  private tail: THREE.Group;

  constructor(config: CamelConfig) {
    this.config = config;
    this.group = new THREE.Group();

    // === BODY — box-based with rounded edges, low-poly style ===
    // Main barrel body
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.9, 0.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    this.group.add(body);

    // Rounded back top
    const backGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 6);
    backGeo.rotateZ(Math.PI / 2);
    const back = new THREE.Mesh(backGeo, bodyMat);
    back.position.set(0, 1.95, 0);
    back.castShadow = true;
    this.group.add(back);

    // === HUMP — prominent single hump ===
    const humpGeo = new THREE.SphereGeometry(0.35, 6, 5);
    humpGeo.scale(0.8, 1.0, 0.7);
    const hump = new THREE.Mesh(humpGeo, bodyMat);
    hump.position.set(-0.1, 2.25, 0);
    hump.castShadow = true;
    this.group.add(hump);

    // === NECK ===
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0.85, 1.8, 0);

    // Neck — tapered cylinder angled forward
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 5);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.set(0.15, 0.5, 0);
    neck.rotation.z = 0.3;
    neck.castShadow = true;
    this.neckPivot.add(neck);

    // === HEAD ===
    this.head = new THREE.Group();
    this.head.position.set(0.4, 0.95, 0);

    // Skull — elongated box
    const headGeo = new THREE.BoxGeometry(0.5, 0.25, 0.28);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Snout/muzzle — slightly protruding
    const muzzleGeo = new THREE.BoxGeometry(0.2, 0.18, 0.24);
    const muzzle = new THREE.Mesh(muzzleGeo, darkMat);
    muzzle.position.set(0.3, -0.04, 0);
    this.head.add(muzzle);

    // Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 4, 4),
        eyeMat
      );
      eye.position.set(0.08, 0.08, side * 0.13);
      this.head.add(eye);
    }

    // Ears — small triangles
    for (const side of [-1, 1]) {
      const earGeo = new THREE.ConeGeometry(0.04, 0.1, 3);
      const ear = new THREE.Mesh(earGeo, darkMat);
      ear.position.set(-0.1, 0.16, side * 0.1);
      ear.rotation.x = side * 0.3;
      this.head.add(ear);
    }

    this.neckPivot.add(this.head);
    this.group.add(this.neckPivot);

    // === LEGS — simple two-segment ===
    const legConfigs = [
      { x: 0.6, z: -0.25 },   // FL
      { x: 0.6, z: 0.25 },    // FR
      { x: -0.6, z: -0.25 },  // BL
      { x: -0.6, z: 0.25 },   // BR
    ];

    const legs: THREE.Group[] = [];
    for (const lc of legConfigs) {
      const leg = this.createLeg();
      leg.position.set(lc.x, 1.1, lc.z);
      this.group.add(leg);
      legs.push(leg);
    }
    this.legFL = legs[0];
    this.legFR = legs[1];
    this.legBL = legs[2];
    this.legBR = legs[3];

    // === TAIL ===
    this.tail = new THREE.Group();
    this.tail.position.set(-1.05, 1.6, 0);
    const tailGeo = new THREE.CylinderGeometry(0.015, 0.035, 0.5, 4);
    const tailMesh = new THREE.Mesh(tailGeo, darkMat);
    tailMesh.position.y = -0.25;
    this.tail.add(tailMesh);
    const tuftGeo = new THREE.SphereGeometry(0.035, 4, 4);
    const tuft = new THREE.Mesh(tuftGeo, darkMat);
    tuft.position.y = -0.5;
    this.tail.add(tuft);
    this.tail.rotation.x = 0.4;
    this.group.add(this.tail);

    // Position and face direction
    this.group.position.copy(config.position);
    this.group.rotation.y = config.facing;
  }

  private createLeg(): THREE.Group {
    const leg = new THREE.Group();

    // Upper leg
    const upperGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 5);
    const upper = new THREE.Mesh(upperGeo, bodyMat);
    upper.position.y = -0.25;
    upper.castShadow = true;
    leg.add(upper);

    // Lower leg
    const lowerGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.5, 5);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = -0.7;
    lower.castShadow = true;
    leg.add(lower);

    // Hoof
    const hoofGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.05, 5);
    const hoof = new THREE.Mesh(hoofGeo, hoofMat);
    hoof.position.y = -0.97;
    leg.add(hoof);

    return leg;
  }

  update(delta: number): void {
    this.config.phase += delta;
    const t = this.config.phase;

    // Head bob
    this.neckPivot.rotation.z = Math.sin(t * 0.8) * 0.04;
    this.head.rotation.z = Math.sin(t * 1.2) * 0.05;

    // Subtle weight shift on legs
    const shift = Math.sin(t * 0.6) * 0.03;
    this.legFL.rotation.x = shift;
    this.legBR.rotation.x = shift;
    this.legFR.rotation.x = -shift;
    this.legBL.rotation.x = -shift;

    // Tail swish
    this.tail.rotation.z = Math.sin(t * 1.8) * 0.2;
  }
}

export class CamelModel {
  camels: Camel[];
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.camels = [];

    // Place camels near the oasis, away from rocks
    const configs: CamelConfig[] = [
      { position: new THREE.Vector3(28, getTerrainHeight(28, 22), 22), phase: 0, facing: 1.2 },
      { position: new THREE.Vector3(25, getTerrainHeight(25, 18), 18), phase: 2.1, facing: 0.8 },
      { position: new THREE.Vector3(32, getTerrainHeight(32, 20), 20), phase: 4.2, facing: 1.5 },
    ];

    for (const config of configs) {
      const camel = new Camel(config);
      this.camels.push(camel);
      this.scene.add(camel.group);
    }
  }

  update(delta: number): void {
    for (const camel of this.camels) {
      camel.update(delta);
    }
  }
}
