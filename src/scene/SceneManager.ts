import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface AtmosphereConfig {
  midColorBoost: number;
  ambientBoost: number;
  sunIntensityBoost: number;
  innerGlow: boolean;
  capstoneBeacon: boolean;
}

const ATMOSPHERE_CONFIGS: AtmosphereConfig[] = [
  { midColorBoost: 0, ambientBoost: 0, sunIntensityBoost: 0, innerGlow: false, capstoneBeacon: false },
  { midColorBoost: 0, ambientBoost: 0, sunIntensityBoost: 0, innerGlow: false, capstoneBeacon: false },
  { midColorBoost: 0.15, ambientBoost: 0.05, sunIntensityBoost: 0.1, innerGlow: false, capstoneBeacon: false },
  { midColorBoost: 0.3, ambientBoost: 0.1, sunIntensityBoost: 0.15, innerGlow: true, capstoneBeacon: false },
  { midColorBoost: 0.45, ambientBoost: 0.15, sunIntensityBoost: 0.2, innerGlow: true, capstoneBeacon: false },
  { midColorBoost: 0.6, ambientBoost: 0.25, sunIntensityBoost: 0.3, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.6, ambientBoost: 0.28, sunIntensityBoost: 0.32, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.65, ambientBoost: 0.3, sunIntensityBoost: 0.35, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
];

const _tempGold = new THREE.Color();

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
  private currentMilestoneLevel = 0;

  get currentDayTime(): number {
    return this.dayTime;
  }
  private innerGlowLight: THREE.PointLight | null = null;
  private capstoneLight: THREE.PointLight | null = null;
  private limestoneCasing: THREE.Group | null = null;
  private entrancePortal: THREE.Mesh | null = null;
  private torchLights: THREE.PointLight[] = [];
  private goldCapstone: THREE.Mesh | null = null;
  private pyramidAura: THREE.Mesh | null = null;

  // Day/night cycle color pairs (allocated once)
  private readonly topDay = new THREE.Color(0x1a237e);
  private readonly topNight = new THREE.Color(0x0a0a2e);
  private readonly midDay = new THREE.Color(0xf5a623);
  private readonly midNight = new THREE.Color(0x2a1a4a);
  private readonly botDay = new THREE.Color(0xe8824a);
  private readonly botNight = new THREE.Color(0x1a0a2e);

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
    this.createPalmTrees();
    this.createOasis();
    this.createDistantDunes();
    this.createDesertScrub();

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

  private createPalmTrees(): void {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1e });
    const frondDarkMat = new THREE.MeshLambertMaterial({ color: 0x1e4a12 });

    const palmPositions = [
      // Cluster around oasis (40, 35)
      { x: 38, z: 33, h: 6.5, s: 0.95 },
      { x: 42, z: 37, h: 7, s: 1.0 },
      { x: 37, z: 38, h: 5.5, s: 0.8 },
      { x: 44, z: 34, h: 6, s: 0.85 },
      // Scattered elsewhere
      { x: -15, z: -22, h: 6.5, s: 0.85 },
      { x: -17, z: -25, h: 7.5, s: 1.1 },
      { x: 35, z: 5, h: 5.5, s: 0.8 },
      { x: -30, z: -15, h: 6, s: 0.9 },
    ];

    for (const p of palmPositions) {
      const group = new THREE.Group();

      // Trunk — slightly tapered cylinder with lean
      const trunkGeo = new THREE.CylinderGeometry(0.15 * p.s, 0.25 * p.s, p.h, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = p.h / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.rotation.x = (Math.random() - 0.5) * 0.1;
      trunk.castShadow = true;
      group.add(trunk);

      // Frond canopy — several drooping cones
      const frondCount = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3;
        const frondGeo = new THREE.ConeGeometry(1.2 * p.s, 2.5 * p.s, 4);
        const mat = Math.random() > 0.4 ? frondMat : frondDarkMat;
        const frond = new THREE.Mesh(frondGeo, mat);
        frond.position.set(
          Math.cos(angle) * 0.8 * p.s,
          p.h - 0.3,
          Math.sin(angle) * 0.8 * p.s
        );
        frond.rotation.x = Math.cos(angle) * 0.7;
        frond.rotation.z = -Math.sin(angle) * 0.7;
        frond.castShadow = true;
        group.add(frond);
      }

      group.position.set(p.x, 0, p.z);
      this.scene.add(group);
    }
  }

  private createOasis(): void {
    const cx = 40;
    const cz = 35;

    // Water surface is now handled by WaterShader in main.ts — no duplicate here

    // Sandy bank ring around the water (sized for radius-6 pool)
    const bankGeo = new THREE.RingGeometry(5.5, 8.0, 24);
    bankGeo.rotateX(-Math.PI / 2);
    const bankMat = new THREE.MeshLambertMaterial({ color: 0xc4a060 });
    const bank = new THREE.Mesh(bankGeo, bankMat);
    bank.position.set(cx, 0.03, cz);
    this.scene.add(bank);

    // Darker wet sand ring at water's edge
    const wetBankGeo = new THREE.RingGeometry(5.2, 6.2, 24);
    wetBankGeo.rotateX(-Math.PI / 2);
    const wetBankMat = new THREE.MeshLambertMaterial({ color: 0x8a7a50 });
    const wetBank = new THREE.Mesh(wetBankGeo, wetBankMat);
    wetBank.position.set(cx, 0.04, cz);
    this.scene.add(wetBank);

    // Reeds — thin cylinders clustered around the water edge
    const reedMat = new THREE.MeshLambertMaterial({ color: 0x4a7a2e });
    const darkReedMat = new THREE.MeshLambertMaterial({ color: 0x3a6a20 });
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const r = 5.0 + Math.random() * 2.0;
      const height = 1.2 + Math.random() * 2.0;
      const reedGeo = new THREE.CylinderGeometry(0.03, 0.05, height, 4);
      const mat = Math.random() > 0.4 ? reedMat : darkReedMat;
      const reed = new THREE.Mesh(reedGeo, mat);
      reed.position.set(
        cx + Math.cos(angle) * r,
        height / 2,
        cz + Math.sin(angle) * r
      );
      reed.rotation.z = (Math.random() - 0.5) * 0.25;
      reed.rotation.x = (Math.random() - 0.5) * 0.1;
      this.scene.add(reed);
    }

    // Small grass tufts near the bank
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x5a8a32 });
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 6.8 + Math.random() * 2.0;
      const turfGeo = new THREE.ConeGeometry(0.2 + Math.random() * 0.15, 0.6 + Math.random() * 0.4, 5);
      const turf = new THREE.Mesh(turfGeo, grassMat);
      turf.position.set(
        cx + Math.cos(angle) * r,
        0.2,
        cz + Math.sin(angle) * r
      );
      this.scene.add(turf);
    }

    // Small rocks at water edge
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x7a7060 });
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5.8 + Math.random() * 1.5;
      const s = 0.15 + Math.random() * 0.25;
      const rockGeo = new THREE.DodecahedronGeometry(s, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        cx + Math.cos(angle) * r,
        s * 0.5,
        cz + Math.sin(angle) * r
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(rock);
    }
  }

  private createDistantDunes(): void {
    const duneMat = new THREE.MeshLambertMaterial({ color: 0xc9a06a });

    const dunes = [
      { x: -80, z: -60, sx: 40, sy: 6, sz: 15 },
      { x: 70, z: -80, sx: 50, sy: 8, sz: 18 },
      { x: -50, z: 80, sx: 45, sy: 5, sz: 20 },
      { x: 90, z: 50, sx: 35, sy: 7, sz: 14 },
      { x: 0, z: -100, sx: 60, sy: 9, sz: 16 },
      { x: -100, z: 20, sx: 30, sy: 5, sz: 12 },
    ];

    for (const d of dunes) {
      const duneGeo = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      duneGeo.scale(d.sx, d.sy, d.sz);
      const dune = new THREE.Mesh(duneGeo, duneMat);
      dune.position.set(d.x, -0.5, d.z);
      dune.rotation.y = Math.random() * Math.PI;
      dune.receiveShadow = true;
      this.scene.add(dune);
    }
  }

  private createDesertScrub(): void {
    const scrubMat = new THREE.MeshLambertMaterial({ color: 0x8a7a3a });
    const dryGreenMat = new THREE.MeshLambertMaterial({ color: 0x6b7a32 });

    const scrubPositions = [
      { x: 18, z: 20, s: 0.6 },
      { x: -25, z: 5, s: 0.5 },
      { x: 30, z: 15, s: 0.7 },
      { x: -12, z: 25, s: 0.4 },
      { x: 15, z: -30, s: 0.55 },
      { x: -35, z: -8, s: 0.5 },
      { x: 40, z: -12, s: 0.45 },
      { x: -8, z: -35, s: 0.6 },
      { x: 22, z: 28, s: 0.35 },
      { x: -28, z: 20, s: 0.5 },
      { x: 35, z: -25, s: 0.4 },
      { x: -40, z: -20, s: 0.55 },
    ];

    for (const p of scrubPositions) {
      const mat = Math.random() > 0.5 ? scrubMat : dryGreenMat;
      // Small irregular bush — icosahedron with random vertex noise
      const bushGeo = new THREE.IcosahedronGeometry(p.s, 1);
      const verts = bushGeo.getAttribute('position');
      for (let i = 0; i < verts.count; i++) {
        verts.setX(i, verts.getX(i) + (Math.random() - 0.5) * 0.2 * p.s);
        verts.setY(i, Math.max(0, verts.getY(i) + (Math.random() - 0.5) * 0.15 * p.s));
        verts.setZ(i, verts.getZ(i) + (Math.random() - 0.5) * 0.2 * p.s);
      }
      bushGeo.computeVertexNormals();

      const bush = new THREE.Mesh(bushGeo, mat);
      bush.position.set(p.x, p.s * 0.3, p.z);
      bush.castShadow = true;
      this.scene.add(bush);
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

  setMilestoneLevel(level: number): void {
    this.currentMilestoneLevel = Math.min(level, ATMOSPHERE_CONFIGS.length - 1);
    const config = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];

    if (config.innerGlow && !this.innerGlowLight) {
      this.innerGlowLight = new THREE.PointLight(0xffaa44, 2, 30, 1.5);
      this.innerGlowLight.position.set(0, 3, 0);
      this.scene.add(this.innerGlowLight);
    } else if (!config.innerGlow && this.innerGlowLight) {
      this.scene.remove(this.innerGlowLight);
      this.innerGlowLight.dispose();
      this.innerGlowLight = null;
    }

    if (config.capstoneBeacon && !this.capstoneLight) {
      this.capstoneLight = new THREE.PointLight(0xffd700, 4, 60, 1);
      this.capstoneLight.position.set(0, 11, 0);
      this.scene.add(this.capstoneLight);
    } else if (!config.capstoneBeacon && this.capstoneLight) {
      this.scene.remove(this.capstoneLight);
      this.capstoneLight.dispose();
      this.capstoneLight = null;
    }

    // Phase 2 visual enhancements
    if (level >= 6) {
      this.createLimestoneCasing();
    } else {
      this.removeLimestoneCasing();
    }

    if (level >= 7) {
      this.createEntrancePortal();
    } else {
      this.removeEntrancePortal();
    }

    if (level >= 8) {
      this.createGoldCapstone();
    } else {
      this.removeGoldCapstone();
    }
  }

  private createLimestoneCasing(): void {
    if (this.limestoneCasing) return;
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const group = new THREE.Group();

    // Pyramid dimensions: base ~21 wide, ~10.5 high (10 layers * 1.05 block unit)
    const halfBase = 10.5;
    const height = 10.5;
    const offset = 0.15; // Slight outward offset from blocks

    // 4 triangular faces matching the pyramid slope
    const faces = [
      // Front (positive Z)
      [
        new THREE.Vector3(-halfBase - offset, 0, halfBase + offset),
        new THREE.Vector3(halfBase + offset, 0, halfBase + offset),
        new THREE.Vector3(0, height, 0),
      ],
      // Back (negative Z)
      [
        new THREE.Vector3(halfBase + offset, 0, -halfBase - offset),
        new THREE.Vector3(-halfBase - offset, 0, -halfBase - offset),
        new THREE.Vector3(0, height, 0),
      ],
      // Left (negative X)
      [
        new THREE.Vector3(-halfBase - offset, 0, -halfBase - offset),
        new THREE.Vector3(-halfBase - offset, 0, halfBase + offset),
        new THREE.Vector3(0, height, 0),
      ],
      // Right (positive X)
      [
        new THREE.Vector3(halfBase + offset, 0, halfBase + offset),
        new THREE.Vector3(halfBase + offset, 0, -halfBase - offset),
        new THREE.Vector3(0, height, 0),
      ],
    ];

    for (const verts of faces) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array([
        verts[0].x, verts[0].y, verts[0].z,
        verts[1].x, verts[1].y, verts[1].z,
        verts[2].x, verts[2].y, verts[2].z,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      const face = new THREE.Mesh(geo, casingMat);
      face.receiveShadow = true;
      group.add(face);
    }

    this.scene.add(group);
    this.limestoneCasing = group;
  }

  private createEntrancePortal(): void {
    if (this.entrancePortal) return;
    const portalGeo = new THREE.PlaneGeometry(2, 3);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 1.5, 10.7);
    this.scene.add(portal);
    this.entrancePortal = portal;

    const torchPositions = [{ x: -1.5 }, { x: 1.5 }];
    for (const tp of torchPositions) {
      const torch = new THREE.PointLight(0xff8800, 1.5, 8, 2);
      torch.position.set(tp.x, 2.5, 11);
      this.scene.add(torch);
      this.torchLights.push(torch);
    }
  }

  private createGoldCapstone(): void {
    if (this.goldCapstone) return;
    const capGeo = new THREE.ConeGeometry(1.5, 1.5, 4);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0xffd700,
      emissiveIntensity: 0.3,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 11.25, 0);
    cap.rotation.y = Math.PI / 4;
    this.scene.add(cap);
    this.goldCapstone = cap;

    const auraGeo = new THREE.SphereGeometry(14, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.position.set(0, 5, 0);
    this.scene.add(aura);
    this.pyramidAura = aura;
  }

  private removeLimestoneCasing(): void {
    if (!this.limestoneCasing) return;
    this.scene.remove(this.limestoneCasing);
    this.limestoneCasing = null;
  }

  private removeEntrancePortal(): void {
    if (this.entrancePortal) {
      this.scene.remove(this.entrancePortal);
      this.entrancePortal = null;
    }
    for (const light of this.torchLights) {
      this.scene.remove(light);
      light.dispose();
    }
    this.torchLights = [];
  }

  private removeGoldCapstone(): void {
    if (this.goldCapstone) {
      this.scene.remove(this.goldCapstone);
      this.goldCapstone = null;
    }
    if (this.pyramidAura) {
      this.scene.remove(this.pyramidAura);
      this.pyramidAura = null;
    }
  }

  update(delta: number): void {
    this.controls.update();

    // Slow day/night cycle — full cycle every 5 minutes
    this.dayTime = (this.dayTime + delta / 300) % 1;

    if (this.skyMaterial) {
      const nightAmount = Math.max(0, Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

      this.skyMaterial.uniforms.topColor.value.lerpColors(this.topDay, this.topNight, nightAmount);
      this.skyMaterial.uniforms.midColor.value.lerpColors(this.midDay, this.midNight, nightAmount);
      this.skyMaterial.uniforms.bottomColor.value.lerpColors(this.botDay, this.botNight, nightAmount);

      // Apply milestone atmosphere boost to mid-color (warmer horizon)
      const atmosConfig = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];
      if (atmosConfig.midColorBoost > 0 && this.skyMaterial) {
        const gold = _tempGold.set(0xffd700);
        this.skyMaterial.uniforms.midColor.value.lerp(gold, atmosConfig.midColorBoost * 0.3);
      }
    }

    if (this.sun) {
      const sunAngle = this.dayTime * Math.PI * 2;
      this.sun.position.y = 20 + Math.sin(sunAngle) * 30;
      this.sun.visible = this.sun.position.y > -5;
    }

    if (this.sunLight) {
      const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
      const atmosConfig = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];
      this.sunLight.intensity = (0.4 + dayFactor * 1.1) + atmosConfig.sunIntensityBoost;
    }
    if (this.ambientLight) {
      const dayFactor = 0.5 + 0.5 * Math.sin(this.dayTime * Math.PI * 2 - Math.PI / 2);
      const atmosConfig = ATMOSPHERE_CONFIGS[this.currentMilestoneLevel];
      this.ambientLight.intensity = (0.15 + dayFactor * 0.25) + atmosConfig.ambientBoost;
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
