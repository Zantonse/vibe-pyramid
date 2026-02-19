import * as THREE from 'three';

interface CamelConfig {
  position: THREE.Vector3;
  phase: number;
}

class Camel {
  group: THREE.Group;
  body: THREE.Mesh;
  hump: THREE.Mesh;
  head: THREE.Mesh;
  neck: THREE.Mesh;
  legs: THREE.Mesh[];
  config: CamelConfig;

  constructor(config: CamelConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.legs = [];

    const tanColor = 0xc4a060;
    const material = new THREE.MeshLambertMaterial({ color: tanColor });

    // Body: BoxGeometry(2.5, 1.5, 1.2)
    const bodyGeometry = new THREE.BoxGeometry(2.5, 1.5, 1.2);
    this.body = new THREE.Mesh(bodyGeometry, material);
    this.body.position.y = 0.9; // Lift body above ground
    this.group.add(this.body);

    // Hump: BoxGeometry(0.8, 0.6, 0.8) on top of body
    const humpGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    this.hump = new THREE.Mesh(humpGeometry, material);
    this.hump.position.y = 1.5; // On top of body
    this.hump.position.z = -0.3; // Slightly back
    this.group.add(this.hump);

    // Neck: BoxGeometry(0.3, 1.0, 0.3) connecting head to body
    const neckGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
    this.neck = new THREE.Mesh(neckGeometry, material);
    this.neck.position.y = 1.5; // Height of connection
    this.neck.position.z = 1.2; // Forward
    this.group.add(this.neck);

    // Head: BoxGeometry(0.6, 0.6, 0.5) extended forward on neck
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.5);
    this.head = new THREE.Mesh(headGeometry, material);
    this.head.position.y = 2.2; // Top of neck
    this.head.position.z = 1.5; // Forward from neck
    this.group.add(this.head);

    // 4 Legs: BoxGeometry(0.3, 1.2, 0.3) at corners underneath body
    const legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);

    // Front-left leg
    const legFL = new THREE.Mesh(legGeometry, material);
    legFL.position.set(-0.8, 0.3, -0.4);
    this.group.add(legFL);
    this.legs.push(legFL);

    // Front-right leg
    const legFR = new THREE.Mesh(legGeometry, material);
    legFR.position.set(0.8, 0.3, -0.4);
    this.group.add(legFR);
    this.legs.push(legFR);

    // Back-left leg
    const legBL = new THREE.Mesh(legGeometry, material);
    legBL.position.set(-0.8, 0.3, 0.4);
    this.group.add(legBL);
    this.legs.push(legBL);

    // Back-right leg
    const legBR = new THREE.Mesh(legGeometry, material);
    legBR.position.set(0.8, 0.3, 0.4);
    this.group.add(legBR);
    this.legs.push(legBR);

    // Set initial position
    this.group.position.copy(config.position);
  }

  update(delta: number): void {
    // Increment phase for animation
    this.config.phase += delta;

    // Idle animation: subtle head bob via sine wave on Y position
    const bobAmount = Math.sin(this.config.phase * 1.5) * 0.1;
    this.head.position.y = 2.2 + bobAmount;
  }
}

export class CamelModel {
  camels: Camel[];
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.camels = [];

    // Create 3 camels near the quarry area (around x:-20, z:10) with slight variation
    const baseX = -20;
    const baseZ = 10;

    const positions = [
      new THREE.Vector3(baseX, 0, baseZ),
      new THREE.Vector3(baseX - 3, 0, baseZ + 2),
      new THREE.Vector3(baseX + 3, 0, baseZ - 2),
    ];

    positions.forEach((pos, index) => {
      const camelConfig: CamelConfig = {
        position: pos,
        phase: (index / 3) * Math.PI * 2, // Stagger initial phases
      };

      const camel = new Camel(camelConfig);
      this.camels.push(camel);
      this.scene.add(camel.group);
    });
  }

  update(delta: number): void {
    this.camels.forEach((camel) => {
      camel.update(delta);
    });
  }
}
