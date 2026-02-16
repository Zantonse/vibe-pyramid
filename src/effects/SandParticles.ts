import * as THREE from 'three';

const PARTICLE_COUNT = 500;

export class SandParticles {
  private particles: THREE.Points;
  private velocities: Float32Array;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      this.velocities[i3] = 2 + Math.random() * 3;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xd4a574,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(delta: number): void {
    const positions = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArray[i3] += this.velocities[i3] * delta;
      posArray[i3 + 1] += this.velocities[i3 + 1] * delta;
      posArray[i3 + 2] += this.velocities[i3 + 2] * delta;

      if (posArray[i3] > 50) {
        posArray[i3] = -50;
        posArray[i3 + 1] = Math.random() * 5;
        posArray[i3 + 2] = (Math.random() - 0.5) * 100;
      }
    }

    positions.needsUpdate = true;
  }
}
