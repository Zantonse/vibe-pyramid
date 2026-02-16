import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  private skyMaterial: THREE.ShaderMaterial | null = null;
  private sun: THREE.Mesh | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private dayTime = 0;
  private _nudgeTarget: THREE.Vector3 | null = null;
  private nudgeProgress = 0;
  private baseTarget = new THREE.Vector3(0, 5, 0);

  constructor() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(30, 25, 30);
    this.camera.lookAt(0, 5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 5, 0);
    this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground
    this.controls.update();

    // Build the scene
    this.createSky();
    this.createTerrain();
    this.createLighting();
    this.createQuarry();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  private createSky(): void {
    // Gradient sky using a large sphere with 3-stop gradient
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a237e) },    // Deep blue
        midColor: { value: new THREE.Color(0xf5a623) },    // Warm gold
        bottomColor: { value: new THREE.Color(0xe8824a) }, // Soft terracotta
        midPoint: { value: 0.15 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float midPoint;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, h);
          vec3 color;
          if (t < midPoint) {
            color = mix(bottomColor, midColor, t / midPoint);
          } else {
            color = mix(midColor, topColor, (t - midPoint) / (1.0 - midPoint));
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
    this.skyMaterial = skyMat;

    // Low-poly sun
    const sunGeo = new THREE.SphereGeometry(8, 8, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-100, 20, -150);
    this.scene.add(sun);
    this.sun = sun;
  }

  private createTerrain(): void {
    // Desert floor with subtle vertex displacement
    const geo = new THREE.PlaneGeometry(500, 500, 64, 64);
    geo.rotateX(-Math.PI / 2);

    // Subtle dune displacement
    const positions = geo.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = Math.sin(x * 0.02) * Math.cos(z * 0.03) * 0.5
              + Math.sin(x * 0.05 + z * 0.04) * 0.3;
      positions.setY(i, y);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ color: 0xd4a574 }); // Sand color
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  private createLighting(): void {
    // Sun directional light
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    sunLight.position.set(-50, 40, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Ambient fill
    const ambient = new THREE.AmbientLight(0xffe0b2, 0.4);
    this.scene.add(ambient);
    this.ambientLight = ambient;
  }

  private createQuarry(): void {
    // Cluster of dark rocks off to the side
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const positions = [
      { x: -20, z: 10, s: 2.5 },
      { x: -22, z: 12, s: 1.8 },
      { x: -18, z: 11, s: 2.0 },
      { x: -21, z: 8, s: 1.5 },
      { x: -19, z: 13, s: 1.2 },
    ];
    for (const pos of positions) {
      const geo = new THREE.DodecahedronGeometry(pos.s, 0);
      const rock = new THREE.Mesh(geo, rockMat);
      rock.position.set(pos.x, pos.s * 0.6, pos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  nudgeTo(worldPos: THREE.Vector3): void {
    this._nudgeTarget = new THREE.Vector3().lerpVectors(this.baseTarget, worldPos, 0.2);
    this._nudgeTarget.y = Math.max(3, this._nudgeTarget.y);
    this.nudgeProgress = 0;
  }

  update(delta: number): void {
    this.controls.update();

    // Slow day/night cycle — full cycle every 5 minutes
    this.dayTime = (this.dayTime + delta / 300) % 1;

    if (this.skyMaterial) {
      const topDay = new THREE.Color(0x1a237e);
      const topNight = new THREE.Color(0x0a0a2e);
      const midDay = new THREE.Color(0xf5a623);
      const midNight = new THREE.Color(0x2a1a4a);
      const botDay = new THREE.Color(0xe8824a);
      const botNight = new THREE.Color(0x1a0a2e);

      const nightAmount = Math.max(0, Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

      this.skyMaterial.uniforms.topColor.value.lerpColors(topDay, topNight, nightAmount);
      this.skyMaterial.uniforms.midColor.value.lerpColors(midDay, midNight, nightAmount);
      this.skyMaterial.uniforms.bottomColor.value.lerpColors(botDay, botNight, nightAmount);
    }

    if (this.sun) {
      const sunAngle = this.dayTime * Math.PI * 2;
      this.sun.position.y = 20 + Math.sin(sunAngle) * 30;
      this.sun.visible = this.sun.position.y > -5;
    }

    if (this.sunLight) {
      const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
      this.sunLight.intensity = 0.4 + dayFactor * 1.1;
    }
    if (this.ambientLight) {
      const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
      this.ambientLight.intensity = 0.15 + dayFactor * 0.25;
    }

    // Camera nudge
    if (this._nudgeTarget) {
      this.nudgeProgress += delta * 0.5;
      if (this.nudgeProgress < 1) {
        const t = 1 - Math.pow(1 - this.nudgeProgress, 2);
        this.controls.target.lerpVectors(this.controls.target, this._nudgeTarget, t * 0.03);
      } else {
        this.controls.target.lerp(this.baseTarget, delta * 0.5);
        if (this.controls.target.distanceTo(this.baseTarget) < 0.1) {
          this._nudgeTarget = null;
        }
      }
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
