import * as THREE from 'three';

interface BirdConfig {
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  height: number;
  flapSpeed: number;
  flapPhase: number;
}

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b6842, roughness: 0.7, metalness: 0.0 });
const wingMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide });
const headMat = new THREE.MeshStandardMaterial({ color: 0xa07850, roughness: 0.65, metalness: 0.0 });
const beakMat = new THREE.MeshStandardMaterial({ color: 0xd4a040, roughness: 0.5, metalness: 0.05 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0x4a2e14, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2, metalness: 0.1 });
const breastMat = new THREE.MeshStandardMaterial({ color: 0xc0956a, roughness: 0.7, metalness: 0.0 });

function createWingGeo(mirror: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const s = mirror;
  const verts = new Float32Array([
    // Triangle 1: shoulder -> mid -> trailing
    0, 0, 0.1,
    s * 1.4, 0.05, -0.1,
    s * 0.4, -0.05, -0.4,
    // Triangle 2: shoulder -> mid -> wingtip
    0, 0, 0.1,
    s * 1.4, 0.05, -0.1,
    s * 1.6, 0.02, -0.5,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

function createTailGeo(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0, 0, 0,
    -0.2, 0, -0.8,
    0.0, 0.03, -0.5,

    0, 0, 0,
    0.2, 0, -0.8,
    0.0, 0.03, -0.5,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

class Bird {
  group: THREE.Group;
  leftWingPivot: THREE.Group;
  rightWingPivot: THREE.Group;
  config: BirdConfig;
  private readonly _nextPos = new THREE.Vector3();

  constructor(config: BirdConfig) {
    this.config = config;
    this.group = new THREE.Group();

    // Body — tapered capsule shape
    const bodyGeo = new THREE.CapsuleGeometry(0.15, 0.5, 4, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.group.add(body);

    // Breast — lighter underside
    const breastGeo = new THREE.SphereGeometry(0.12, 5, 4, 0, Math.PI * 2, Math.PI / 3, Math.PI / 2);
    breastGeo.rotateX(Math.PI / 2);
    const breast = new THREE.Mesh(breastGeo, breastMat);
    breast.position.set(0, -0.04, 0.05);
    this.group.add(breast);

    // Head — small sphere forward
    const headGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.04, 0.42);
    head.castShadow = true;
    this.group.add(head);

    // Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eye.position.set(side * 0.08, 0.07, 0.5);
      this.group.add(eye);
    }

    // Beak — tiny cone
    const beakGeo = new THREE.ConeGeometry(0.04, 0.14, 4);
    beakGeo.rotateX(-Math.PI / 2);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.02, 0.56);
    this.group.add(beak);

    // Left wing on pivot
    this.leftWingPivot = new THREE.Group();
    this.leftWingPivot.position.set(-0.1, 0.05, 0);
    const leftWing = new THREE.Mesh(createWingGeo(-1), wingMat);
    leftWing.castShadow = true;
    this.leftWingPivot.add(leftWing);
    this.group.add(this.leftWingPivot);

    // Right wing on pivot
    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(0.1, 0.05, 0);
    const rightWing = new THREE.Mesh(createWingGeo(1), wingMat);
    rightWing.castShadow = true;
    this.rightWingPivot.add(rightWing);
    this.group.add(this.rightWingPivot);

    // Tail
    const tail = new THREE.Mesh(createTailGeo(), tailMat);
    tail.position.set(0, 0, -0.35);
    this.group.add(tail);

    this.group.scale.setScalar(1.2);
  }

  update(delta: number): void {
    this.config.angle += this.config.angularSpeed * delta;

    const x = Math.cos(this.config.angle) * this.config.orbitRadius;
    const z = Math.sin(this.config.angle) * this.config.orbitRadius;
    const y = this.config.height + Math.sin(this.config.angle * 2.5) * 0.8;

    this.group.position.set(x, y, z);

    // Look toward flight direction
    const ahead = this.config.angle + this.config.angularSpeed * 0.15;
    this._nextPos.set(
      Math.cos(ahead) * this.config.orbitRadius,
      y,
      Math.sin(ahead) * this.config.orbitRadius
    );
    this.group.lookAt(this._nextPos);

    // Banking
    this.group.rotation.z = -0.15 * Math.sign(this.config.angularSpeed);

    // Wing flap
    this.config.flapPhase += this.config.flapSpeed * delta;
    const raw = Math.sin(this.config.flapPhase);
    const flap = raw > 0 ? raw * 0.6 : raw * 0.35;

    this.leftWingPivot.rotation.z = flap;
    this.rightWingPivot.rotation.z = -flap;
  }
}

export class BirdFlock {
  private birds: Bird[] = [];

  constructor(scene: THREE.Scene) {
    const configs: BirdConfig[] = [
      { angle: 0, angularSpeed: 0.25, orbitRadius: 20, height: 16, flapSpeed: 3.5, flapPhase: 0 },
      { angle: 2.1, angularSpeed: 0.30, orbitRadius: 24, height: 18, flapSpeed: 3.0, flapPhase: 1.8 },
      { angle: 4.2, angularSpeed: 0.22, orbitRadius: 28, height: 14, flapSpeed: 3.8, flapPhase: 3.6 },
    ];

    for (const config of configs) {
      const bird = new Bird(config);
      this.birds.push(bird);
      scene.add(bird.group);
    }
  }

  update(delta: number): void {
    for (let i = 0; i < this.birds.length; i++) {
      this.birds[i].update(delta);
    }
  }
}
