import * as THREE from 'three';

interface BirdConfig {
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  height: number;
  flapSpeed: number;
  flapPhase: number;
}

class Bird {
  group: THREE.Group;
  body: THREE.Mesh;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  config: BirdConfig;
  nextPosition: THREE.Vector3;

  constructor(config: BirdConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.nextPosition = new THREE.Vector3();

    // Create body: elongated sphere
    const bodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const bodyScale = new THREE.Vector3(1, 0.6, 2);
    bodyGeometry.scale(bodyScale.x, bodyScale.y, bodyScale.z);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.group.add(this.body);

    // Create left wing: triangle
    const wingGeometry1 = new THREE.BufferGeometry();
    const wingVertices1 = new Float32Array([
      0, 0, 0,      // origin
      -1.5, 0.2, -0.2,  // tip
      -1.5, -0.2, 0.2,  // bottom
    ]);
    wingGeometry1.setAttribute('position', new THREE.BufferAttribute(wingVertices1, 3));
    wingGeometry1.computeVertexNormals();
    const wingMaterial1 = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.leftWing = new THREE.Mesh(wingGeometry1, wingMaterial1);
    this.leftWing.position.set(-0.3, 0, 0);
    this.group.add(this.leftWing);

    // Create right wing: triangle
    const wingGeometry2 = new THREE.BufferGeometry();
    const wingVertices2 = new Float32Array([
      0, 0, 0,      // origin
      1.5, 0.2, -0.2,   // tip
      1.5, -0.2, 0.2,   // bottom
    ]);
    wingGeometry2.setAttribute('position', new THREE.BufferAttribute(wingVertices2, 3));
    wingGeometry2.computeVertexNormals();
    const wingMaterial2 = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.rightWing = new THREE.Mesh(wingGeometry2, wingMaterial2);
    this.rightWing.position.set(0.3, 0, 0);
    this.group.add(this.rightWing);
  }

  update(delta: number): void {
    // Advance angle
    this.config.angle += this.config.angularSpeed * delta;

    // Calculate current position on orbit
    const x = Math.cos(this.config.angle) * this.config.orbitRadius;
    const z = Math.sin(this.config.angle) * this.config.orbitRadius;
    const y = this.config.height;

    this.group.position.set(x, y, z);

    // Calculate next position for lookAt
    const nextAngle = this.config.angle + this.config.angularSpeed * delta;
    const nextX = Math.cos(nextAngle) * this.config.orbitRadius;
    const nextZ = Math.sin(nextAngle) * this.config.orbitRadius;
    this.nextPosition.set(nextX, y, nextZ);

    // Look at next position
    this.group.lookAt(this.nextPosition);

    // Flap wings
    this.config.flapPhase += this.config.flapSpeed * delta;
    const flapAmount = Math.sin(this.config.flapPhase);

    this.leftWing.rotation.z = flapAmount * 0.5;
    this.rightWing.rotation.z = -flapAmount * 0.5;
  }
}

export class BirdFlock {
  birds: Bird[];
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.birds = [];

    // Create 6 birds with varying heights and radii
    const birdCount = 6;
    for (let i = 0; i < birdCount; i++) {
      const height = 12 + (i / birdCount) * 8; // 12-20
      const orbitRadius = 15 + (i / birdCount) * 15; // 15-30
      const angle = (i / birdCount) * Math.PI * 2; // Spread around circle
      const angularSpeed = 0.3 + Math.random() * 0.2; // Varying speeds
      const flapSpeed = 3 + Math.random() * 2; // Varying flap speeds
      const flapPhase = Math.random() * Math.PI * 2; // Random flap phase

      const birdConfig: BirdConfig = {
        angle,
        angularSpeed,
        orbitRadius,
        height,
        flapSpeed,
        flapPhase,
      };

      const bird = new Bird(birdConfig);
      this.birds.push(bird);
      this.scene.add(bird.group);
    }
  }

  update(delta: number): void {
    this.birds.forEach((bird) => {
      bird.update(delta);
    });
  }
}
