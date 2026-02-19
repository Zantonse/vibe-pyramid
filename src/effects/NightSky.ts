import * as THREE from 'three';

const STAR_COUNT = 2000;
const SPHERE_RADIUS = 450;

export class NightSky {
  private stars: THREE.Points;
  private moon: THREE.Mesh;
  private starMaterial: THREE.ShaderMaterial;
  private moonMaterial: THREE.MeshBasicMaterial;
  private time = 0;

  constructor(scene: THREE.Scene) {
    // Create stars as point cloud
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const phases = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      // Generate random points on upper hemisphere of sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI / 2; // Upper hemisphere only

      positions[i3] = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = SPHERE_RADIUS * Math.cos(phi);
      positions[i3 + 2] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);

      // Per-star phase offset for twinkle variation
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const vertexShader = `
      attribute float aPhase;
      varying float vPhase;

      void main() {
        vPhase = aPhase;
        gl_PointSize = 1.5 + sin(aPhase) * 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uOpacity;
      uniform float uTime;
      varying float vPhase;

      void main() {
        // Twinkle effect
        float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + vPhase * 6.28);

        // Soft circle mask
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);

        if (dist > 0.5) {
          discard;
        }

        gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity * twinkle);
      }
    `;

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.0 },
        uTime: { value: 0.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geometry, this.starMaterial);
    scene.add(this.stars);

    // Create moon
    const moonGeo = new THREE.SphereGeometry(5, 16, 16);
    this.moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8e8f0,
      transparent: true,
      opacity: 0,
    });
    this.moon = new THREE.Mesh(moonGeo, this.moonMaterial);
    this.moon.position.set(80, 60, 100);
    scene.add(this.moon);
  }

  update(delta: number, dayTime: number): void {
    // Increment internal time counter
    this.time += delta;

    // Calculate night amount: full night is around dayTime 0.5-1.0
    const nightAmount = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

    // Star opacity: fade in when nightAmount > 0.15, full at nightAmount ~0.5
    let starOpacity = 0;
    if (nightAmount > 0.15) {
      starOpacity = Math.min(1, (nightAmount - 0.15) / 0.35);
    }

    // Update star uniforms
    this.starMaterial.uniforms.uOpacity.value = starOpacity;
    this.starMaterial.uniforms.uTime.value = this.time;

    // Moon opacity follows star opacity, capped at 0.8
    const moonOpacity = Math.min(0.8, starOpacity);
    this.moonMaterial.opacity = moonOpacity;

    // Move moon Y position: 40 + sin(dayTime * PI * 2 + PI) * 30
    this.moon.position.y = 40 + Math.sin(dayTime * Math.PI * 2 + Math.PI) * 30;

    // Hide moon mesh when opacity < 0.05
    this.moon.visible = moonOpacity >= 0.05;
  }
}
