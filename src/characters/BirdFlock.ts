import * as THREE from 'three';

interface BirdConfig {
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  height: number;
  flapSpeed: number;
  flapPhase: number;
}

const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b6842 });
const wingMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e, side: THREE.DoubleSide });
const headMat = new THREE.MeshLambertMaterial({ color: 0xa07850 });
const beakMat = new THREE.MeshLambertMaterial({ color: 0xd4a040 });
const tailMat = new THREE.MeshLambertMaterial({ color: 0x4a2e14, side: THREE.DoubleSide });

function createWingGeo(mirror: number): THREE.BufferGeometry {
  // Wing: 4-vertex quad — shoulder, mid-tip, wingtip, trailing edge
  const geo = new THREE.BufferGeometry();
  const s = mirror; // 1 = right, -1 = left
  const verts = new Float32Array([
    // Triangle 1: shoulder → mid → trailing
    0, 0, 0.1,
    s * 1.4, 0.05, -0.1,
    s * 0.4, -0.05, -0.4,
    // Triangle 2: shoulder → mid → wingtip
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
    // Forked tail — two triangles fanning back
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
    bodyGeo.rotateX(Math.PI / 2); // Align along Z (forward)
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.group.add(body);

    // Head — small sphere forward
    const headGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.04, 0.42);
    this.group.add(head);

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
    this.leftWingPivot.add(leftWing);
    this.group.add(this.leftWingPivot);

    // Right wing on pivot
    this.rightWingPivot = new THREE.Group();
    this.rightWingPivot.position.set(0.1, 0.05, 0);
    const rightWing = new THREE.Mesh(createWingGeo(1), wingMat);
    this.rightWingPivot.add(rightWing);
    this.group.add(this.rightWingPivot);

    // Tail
    const tail = new THREE.Mesh(createTailGeo(), tailMat);
    tail.position.set(0, 0, -0.35);
    this.group.add(tail);

    // Scale the whole bird up slightly
    this.group.scale.setScalar(1.2);
  }

  update(delta: number): void {
    this.config.angle += this.config.angularSpeed * delta;

    const x = Math.cos(this.config.angle) * this.config.orbitRadius;
    const z = Math.sin(this.config.angle) * this.config.orbitRadius;
    // Gentle height undulation for natural soaring
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

    // Banking — tilt into the turn
    this.group.rotation.z = -0.15 * Math.sign(this.config.angularSpeed);

    // Wing flap — smooth sinusoidal with asymmetric up/down
    this.config.flapPhase += this.config.flapSpeed * delta;
    const raw = Math.sin(this.config.flapPhase);
    // Sharper upstroke, slower downstroke
    const flap = raw > 0 ? raw * 0.6 : raw * 0.35;

    this.leftWingPivot.rotation.z = flap;
    this.rightWingPivot.rotation.z = -flap;
  }
}

export class BirdFlock {
  private birds: Bird[] = [];

  constructor(scene: THREE.Scene) {
    // Just 3 birds — a small group of desert hawks
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
