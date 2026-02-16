import * as THREE from 'three';

const PARTICLE_COUNT = 1500;

export class SandParticles {
  private particles: THREE.Points;
  private velocities: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = new Float32Array(PARTICLE_COUNT * 3);
    this.sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = Math.random() * 8;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      this.velocities[i3] = 2 + Math.random() * 4;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.8;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 1.5;

      // 8% are dust clumps (size 0.4-0.7), rest are fine grains (size 0.1-0.25)
      if (Math.random() < 0.08) {
        this.sizes[i] = 0.4 + Math.random() * 0.3;
      } else {
        this.sizes[i] = 0.1 + Math.random() * 0.15;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    const vertexShader = `
      attribute float aSize;
      varying float vOpacity;

      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (200.0 / -mvPos.z);
        vOpacity = smoothstep(150.0, 20.0, -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const fragmentShader = `
      varying float vOpacity;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float distance = length(center);

        if (distance > 0.5) {
          discard;
        }

        float edge = smoothstep(0.5, 0.3, distance);
        gl_FragColor = vec4(0.835, 0.647, 0.455, edge * vOpacity * 0.6);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
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
        posArray[i3 + 1] = Math.random() * 8;
        posArray[i3 + 2] = (Math.random() - 0.5) * 100;
      }
    }

    positions.needsUpdate = true;
  }
}
