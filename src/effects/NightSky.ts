import * as THREE from 'three';

const STAR_COUNT = 2000;
const SPHERE_RADIUS = 450;

export class NightSky {
  private stars: THREE.Points;
  private moonGroup: THREE.Group;
  private moonMaterial: THREE.MeshBasicMaterial;
  private haloMaterial: THREE.MeshBasicMaterial;
  private starMaterial: THREE.ShaderMaterial;
  private time = 0;

  constructor(scene: THREE.Scene) {
    // Create stars as point cloud
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const phases = new Float32Array(STAR_COUNT);
    const starSizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI / 2;

      positions[i3] = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = SPHERE_RADIUS * Math.cos(phi);
      positions[i3 + 2] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);

      phases[i] = Math.random() * Math.PI * 2;
      // Varied star sizes — most small, a few bright ones
      starSizes[i] = Math.random() < 0.05 ? 2.5 + Math.random() * 1.5 : 1.0 + Math.random() * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));

    const vertexShader = `
      attribute float aPhase;
      attribute float aSize;
      varying float vPhase;
      varying float vSize;

      void main() {
        vPhase = aPhase;
        vSize = aSize;
        gl_PointSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uOpacity;
      uniform float uTime;
      varying float vPhase;
      varying float vSize;

      void main() {
        // Twinkle effect — brighter stars twinkle more
        float twinkleIntensity = 0.2 + (vSize / 4.0) * 0.3;
        float twinkle = (1.0 - twinkleIntensity) + twinkleIntensity * sin(uTime * 2.0 + vPhase * 6.28);

        // Soft circle mask
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;

        float alpha = smoothstep(0.5, 0.2, dist);

        // Slight warm tint for brighter stars
        float warmth = vSize / 4.0 * 0.15;
        vec3 color = vec3(1.0, 1.0 - warmth * 0.3, 1.0 - warmth);

        gl_FragColor = vec4(color, uOpacity * twinkle * alpha);
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

    // Create moon group
    this.moonGroup = new THREE.Group();
    this.moonGroup.position.set(80, 60, 100);

    // Moon sphere with crater displacement
    const moonGeo = new THREE.SphereGeometry(5, 24, 24);
    const moonVerts = moonGeo.getAttribute('position');
    const moonNormals = moonGeo.getAttribute('normal');

    // Add crater-like depressions
    const craters = [
      { cx: 0.3, cy: 0.2, cz: 0.7, r: 0.25, depth: 0.12 },
      { cx: -0.5, cy: 0.4, cz: 0.5, r: 0.18, depth: 0.08 },
      { cx: 0.6, cy: -0.3, cz: 0.5, r: 0.15, depth: 0.06 },
      { cx: -0.2, cy: 0.6, cz: 0.5, r: 0.2, depth: 0.1 },
      { cx: 0.1, cy: -0.5, cz: 0.6, r: 0.12, depth: 0.05 },
      { cx: -0.4, cy: -0.2, cz: 0.7, r: 0.22, depth: 0.09 },
    ];

    for (let i = 0; i < moonVerts.count; i++) {
      const nx = moonNormals.getX(i);
      const ny = moonNormals.getY(i);
      const nz = moonNormals.getZ(i);

      let displacement = 0;
      for (const crater of craters) {
        const dx = nx - crater.cx;
        const dy = ny - crater.cy;
        const dz = nz - crater.cz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < crater.r) {
          const t = dist / crater.r;
          displacement -= crater.depth * (1 - t * t) * 5; // parabolic crater shape
        }
      }

      // Also add subtle general bumpiness
      displacement += (Math.sin(nx * 15) * Math.cos(ny * 12) * Math.sin(nz * 18)) * 0.03;

      moonVerts.setX(i, moonVerts.getX(i) + nx * displacement);
      moonVerts.setY(i, moonVerts.getY(i) + ny * displacement);
      moonVerts.setZ(i, moonVerts.getZ(i) + nz * displacement);
    }
    moonGeo.computeVertexNormals();

    // Moon material — warm desert moonlight color
    this.moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xeae8d8,
      transparent: true,
      opacity: 0,
    });
    const moon = new THREE.Mesh(moonGeo, this.moonMaterial);
    this.moonGroup.add(moon);

    // Glow halo — larger, faint, transparent sphere behind moon
    const haloGeo = new THREE.SphereGeometry(8, 16, 16);
    this.haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xf0e8c8,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, this.haloMaterial);
    this.moonGroup.add(halo);

    // Secondary soft outer glow
    const outerGlowGeo = new THREE.SphereGeometry(12, 12, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf5f0d0,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    this.moonGroup.add(outerGlow);

    scene.add(this.moonGroup);
  }

  update(delta: number, dayTime: number): void {
    this.time += delta;

    const nightAmount = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

    let starOpacity = 0;
    if (nightAmount > 0.15) {
      starOpacity = Math.min(1, (nightAmount - 0.15) / 0.35);
    }

    this.starMaterial.uniforms.uOpacity.value = starOpacity;
    this.starMaterial.uniforms.uTime.value = this.time;

    // Moon opacity
    const moonOpacity = Math.min(0.85, starOpacity);
    this.moonMaterial.opacity = moonOpacity;
    this.haloMaterial.opacity = moonOpacity * 0.15;

    // Outer glow
    const outerGlow = this.moonGroup.children[2];
    if (outerGlow instanceof THREE.Mesh) {
      (outerGlow.material as THREE.MeshBasicMaterial).opacity = moonOpacity * 0.06;
    }

    // Move moon
    this.moonGroup.position.y = 40 + Math.sin(dayTime * Math.PI * 2 + Math.PI) * 30;

    // Slow moon rotation to show crater detail
    if (this.moonGroup.children[0]) {
      this.moonGroup.children[0].rotation.y = this.time * 0.01;
    }

    this.moonGroup.visible = moonOpacity >= 0.05;
  }
}
