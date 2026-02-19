import * as THREE from 'three';

interface Particle {
  life: number;
  maxLife: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alpha: number;
}

const MAX_BURSTS = 5;
const PARTICLES_PER_BURST = 10;
const MAX_PARTICLES = MAX_BURSTS * PARTICLES_PER_BURST;

export class DustBurst {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private points: THREE.Points;

  // Buffers for all particles
  private positions: Float32Array;
  private alphas: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Pre-allocate buffers for max 50 particles (5 bursts of 10)
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.alphas = new Float32Array(MAX_PARTICLES);
    this.sizes = new Float32Array(MAX_PARTICLES);

    // Create geometry with shared buffers
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    // Vertex shader with billboard points scaled by distance
    const vertexShader = `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;

      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (150.0 / -mvPos.z);
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // Fragment shader with soft circle and alpha fade
    const fragmentShader = `
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);

        if (dist > 0.5) {
          discard;
        }

        float softAlpha = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(0.843, 0.647, 0.455, softAlpha * vAlpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  emit(position: THREE.Vector3): void {
    // Create 10 particles radiating outward and upward with gravity
    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      // Random angle around vertical axis
      const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2;
      const horizontalSpeed = 3 + Math.random() * 2; // 3-5 m/s outward

      const particle: Particle = {
        life: 0,
        maxLife: 0.4, // Particles live for 0.4 seconds
        position: position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * horizontalSpeed,
          2 + Math.random() * 1.5, // 2-3.5 m/s upward
          Math.sin(angle) * horizontalSpeed,
        ),
        alpha: 1.0,
      };

      this.particles.push(particle);
    }
  }

  update(delta: number): void {
    const gravity = -9.8;

    // Update all particles (swap-and-pop for O(1) removal)
    let aliveCount = this.particles.length;
    for (let i = aliveCount - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Increment life
      particle.life += delta;

      // Swap-and-pop if expired
      if (particle.life >= particle.maxLife) {
        const lastIdx = aliveCount - 1;
        if (i !== lastIdx) {
          this.particles[i] = this.particles[lastIdx];
        }
        this.particles.pop();
        aliveCount--;
        continue;
      }

      // Apply gravity to velocity
      particle.velocity.y += gravity * delta;

      // Update position
      particle.position.addScaledVector(particle.velocity, delta);

      // Linear fade out based on life progress
      particle.alpha = 1.0 - (particle.life / particle.maxLife);
    }

    // Write particle data to buffers
    let bufferIndex = 0;

    for (const particle of this.particles) {
      const pi3 = bufferIndex * 3;
      this.positions[pi3] = particle.position.x;
      this.positions[pi3 + 1] = particle.position.y;
      this.positions[pi3 + 2] = particle.position.z;

      this.alphas[bufferIndex] = particle.alpha;
      this.sizes[bufferIndex] = 0.4; // Consistent particle size

      bufferIndex++;
    }

    // Zero out unused buffer slots
    for (let i = bufferIndex; i < MAX_PARTICLES; i++) {
      this.alphas[i] = 0;
      this.sizes[i] = 0;
    }

    // Mark all geometry attributes as needsUpdate
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
  }
}
