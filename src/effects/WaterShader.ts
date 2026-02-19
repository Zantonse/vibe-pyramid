import * as THREE from 'three';

export class WaterShader {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create geometry: CircleGeometry with 4 segments and 32 rings
    const geometry = new THREE.CircleGeometry(4, 32);

    // Vertex shader
    const vertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying float vDistFromCenter;

      void main() {
        vUv = uv;

        // Calculate distance from center (0.5, 0.5)
        vec2 centerUv = uv - 0.5;
        vDistFromCenter = length(centerUv) * 2.0;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader with animated UV ripple, edge fade, day/night blend, and shimmer
    const fragmentShader = `
      uniform float uTime;
      uniform float uDayTime;
      uniform vec3 uBaseColor;
      uniform vec3 uNightColor;
      varying vec2 vUv;
      varying float vDistFromCenter;

      void main() {
        vec2 uv = vUv - 0.5; // Center UVs around (0, 0)

        // 3 overlapping sine wave ripples for animated distortion
        float dist = length(uv);
        float ripple1 = sin(dist * 10.0 - uTime * 2.0) * 0.02;
        float ripple2 = sin(dist * 6.0 - uTime * 1.5 + 2.0) * 0.015;
        float ripple3 = sin(dist * 4.0 - uTime * 1.0 + 4.0) * 0.01;

        vec2 distortedUv = uv + vec2(ripple1 + ripple2 + ripple3);

        // Edge fade: distance from center fades to transparent
        float edgeFade = smoothstep(0.5, 0.0, vDistFromCenter);

        // Day/night color blend
        // uDayTime cycles 0->1->0 (0=day, 0.5=night, 1=day)
        // At 0 (day) and 1 (day): use baseColor
        // At 0.5 (night): use nightColor
        float nightAmount = abs(sin(uDayTime * 3.14159 * 2.0 - 3.14159 / 2.0));
        vec3 waterColor = mix(uBaseColor, uNightColor, nightAmount);

        // Surface shimmer highlights: high-frequency noise
        float shimmer = sin(length(distortedUv) * 20.0 + uTime * 3.0) * 0.5 + 0.5;
        shimmer *= sin(atan(distortedUv.y, distortedUv.x) * 4.0 + uTime * 2.5) * 0.5 + 0.5;
        shimmer = pow(shimmer, 2.0) * 0.15; // Boost shimmer prominence

        // Combine color with shimmer
        vec3 finalColor = waterColor + vec3(shimmer);

        // Apply edge fade as alpha and adjust for transparency
        float alpha = edgeFade * 0.7;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDayTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x1a6b8a) },
        uNightColor: { value: new THREE.Color(0x0a3040) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.receiveShadow = true;

    // Rotate -PI/2 around X axis (to face upward)
    this.mesh.rotation.x = -Math.PI / 2;

    // Position water at (26, 0.05, -17)
    this.mesh.position.set(26, 0.05, -17);

    // Add to scene
    this.scene.add(this.mesh);
  }

  update(delta: number, dayTime: number): void {
    // Increment uTime
    this.material.uniforms.uTime.value += delta;

    // Update uDayTime
    this.material.uniforms.uDayTime.value = dayTime;
  }
}
