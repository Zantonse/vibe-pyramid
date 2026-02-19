import * as THREE from 'three';

interface Particle {
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

interface TorchEmitter {
  origin: THREE.Vector3;
  light: THREE.PointLight;
  particles: Particle[];
  baseIntensity: number;
}

export class TorchFire {
  private scene: THREE.Scene;
  private emitters: TorchEmitter[] = [];
  private maxTorches: number;
  private maxParticlesPerTorch: number = 40;

  // Buffers for all particles across all torches
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private points: THREE.Points;

  constructor(scene: THREE.Scene, maxTorches: number = 12) {
    this.scene = scene;
    this.maxTorches = maxTorches;

    const totalParticles = maxTorches * this.maxParticlesPerTorch;

    // Pre-allocate buffers
    this.positions = new Float32Array(totalParticles * 3);
    this.colors = new Float32Array(totalParticles * 4);
    this.sizes = new Float32Array(totalParticles);

    // Create geometry with shared buffers
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Vertex shader with size attribute and color
    const vertexShader = `
      attribute vec4 color;
      attribute float size;
      varying vec4 vColor;

      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (100.0 / -mvPos.z);
        vColor = color;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // Fragment shader with soft circle and smoothstep alpha
    const fragmentShader = `
      varying vec4 vColor;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);

        if (dist > 0.5) {
          discard;
        }

        float alpha = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  addTorch(position: THREE.Vector3, intensity: number = 1.5): void {
    if (this.emitters.length >= this.maxTorches) {
      return; // Max torches reached
    }

    // Create point light slightly above the torch position
    const lightPos = new THREE.Vector3(position.x, position.y + 0.5, position.z);
    const light = new THREE.PointLight(0xff6600, intensity, 10, 2);
    light.position.copy(lightPos);
    this.scene.add(light);

    // Create emitter entry
    const emitter: TorchEmitter = {
      origin: position.clone(),
      light,
      particles: [],
      baseIntensity: intensity,
    };

    this.emitters.push(emitter);
  }

  removeTorch(position: THREE.Vector3): void {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      const distance = emitter.origin.distanceTo(position);

      if (distance < 0.5) {
        this.scene.remove(emitter.light);
        this.emitters.splice(i, 1);
        return;
      }
    }
  }

  removeAll(): void {
    for (const emitter of this.emitters) {
      this.scene.remove(emitter.light);
    }
    this.emitters = [];
  }

  update(delta: number): void {
    let globalParticleIndex = 0;

    // Process each emitter
    for (const emitter of this.emitters) {
      // Spawn particles up to 40 per emitter
      while (emitter.particles.length < this.maxParticlesPerTorch) {
        const particle: Particle = {
          life: 0,
          maxLife: 0.3 + Math.random() * 0.5, // 0.3-0.8s
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 1.0, // ±0.5
            1.5 + Math.random() * 2.0, // 1.5-3.5
            (Math.random() - 0.5) * 1.0, // ±0.5
          ),
        };
        emitter.particles.push(particle);
      }

      // Update particles for this emitter
      for (let i = emitter.particles.length - 1; i >= 0; i--) {
        const particle = emitter.particles[i];

        // Increment life
        particle.life += delta;

        // Reset if life exceeds maxLife
        if (particle.life >= particle.maxLife) {
          emitter.particles.splice(i, 1);
          continue;
        }

        // Apply turbulence to velocity
        particle.velocity.x += (Math.random() - 0.5) * 3 * delta;
        particle.velocity.z += (Math.random() - 0.5) * 3 * delta;

        globalParticleIndex++;
      }

      // Update light flicker
      const flicker = 0.8 + Math.random() * 0.4;
      emitter.light.intensity = emitter.baseIntensity * flicker;
    }

    // Fill particle data into buffers
    let bufferIndex = 0;

    for (const emitter of this.emitters) {
      for (const particle of emitter.particles) {
        // Calculate position: origin + velocity * life
        const pos = emitter.origin
          .clone()
          .add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.6, // ±0.3
            0,
            (Math.random() - 0.5) * 0.6, // ±0.3
          ))
          .addScaledVector(particle.velocity, particle.life);

        const pi3 = bufferIndex * 3;
        this.positions[pi3] = pos.x;
        this.positions[pi3 + 1] = pos.y;
        this.positions[pi3 + 2] = pos.z;

        // Color gradient: white -> yellow -> transparent based on life progress
        const t = particle.life / particle.maxLife;
        let r: number, g: number, b: number, a: number;

        if (t < 0.5) {
          // First half: white (1, 1, 0.3) -> yellow (1, 0.5, 0)
          const t2 = t * 2; // 0 to 1
          r = 1;
          g = 1 - t2 * 0.5; // 1 -> 0.5
          b = 0.3 - t2 * 0.3; // 0.3 -> 0
          a = 1;
        } else {
          // Second half: yellow (1, 0.5, 0) -> transparent
          const t2 = (t - 0.5) * 2; // 0 to 1
          r = 1;
          g = 0.5;
          b = 0;
          a = 1 - t2; // 1 -> 0
        }

        const pi4 = bufferIndex * 4;
        this.colors[pi4] = r;
        this.colors[pi4 + 1] = g;
        this.colors[pi4 + 2] = b;
        this.colors[pi4 + 3] = a;

        // Size: 0.3 + (1 - t) * 0.4
        this.sizes[bufferIndex] = 0.3 + (1 - t) * 0.4;

        bufferIndex++;
      }
    }

    // Zero out unused buffer slots
    const totalParticles = this.maxTorches * this.maxParticlesPerTorch;
    for (let i = bufferIndex; i < totalParticles; i++) {
      this.sizes[i] = 0;
    }

    // Mark all geometry attributes as needsUpdate
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;
  }
}
