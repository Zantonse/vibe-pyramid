import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getTerrainHeight } from './terrainHeight.js';

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
  // Levels 14-17 (fill to match original 18 milestones)
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  // Levels 18-23 (gradual ramp)
  { midColorBoost: 0.72, ambientBoost: 0.36, sunIntensityBoost: 0.42, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.74, ambientBoost: 0.37, sunIntensityBoost: 0.44, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.76, ambientBoost: 0.38, sunIntensityBoost: 0.46, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.78, ambientBoost: 0.39, sunIntensityBoost: 0.48, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.8, ambientBoost: 0.4, sunIntensityBoost: 0.5, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.82, ambientBoost: 0.41, sunIntensityBoost: 0.52, innerGlow: true, capstoneBeacon: true },
  // Levels 24-29
  { midColorBoost: 0.84, ambientBoost: 0.42, sunIntensityBoost: 0.54, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.86, ambientBoost: 0.43, sunIntensityBoost: 0.56, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.88, ambientBoost: 0.44, sunIntensityBoost: 0.58, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.9, ambientBoost: 0.45, sunIntensityBoost: 0.6, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.92, ambientBoost: 0.46, sunIntensityBoost: 0.62, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.94, ambientBoost: 0.47, sunIntensityBoost: 0.64, innerGlow: true, capstoneBeacon: true },
  // Levels 30-35 (peak atmosphere)
  { midColorBoost: 0.96, ambientBoost: 0.48, sunIntensityBoost: 0.66, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.98, ambientBoost: 0.49, sunIntensityBoost: 0.68, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
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

  // Free roam camera
  private freeRoam = false;
  private freeRoamYaw = 0;
  private freeRoamPitch = -0.3; // slight downward look
  private keysDown = new Set<string>();
  private freeRoamToggleEl: HTMLElement | null = null;

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
    this.createRockyOutcrops();
    this.createNileRiver();

    this.createDesertRocks();
    this.createDistanceFog();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    // Free roam input
    this.setupFreeRoam();
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
    // Desert floor with multi-octave dune displacement
    const geo = new THREE.PlaneGeometry(500, 500, 128, 128);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      positions.setY(i, getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();

    // Add per-vertex color variation for natural sand look
    const colors = new Float32Array(positions.count * 3);
    const baseColor = new THREE.Color(0xd4a574);
    const warmColor = new THREE.Color(0xdbb080);
    const coolColor = new THREE.Color(0xc09060);
    for (let i = 0; i < positions.count; i++) {
      const blend = Math.random();
      const c = blend < 0.5
        ? baseColor.clone().lerp(warmColor, blend * 2)
        : baseColor.clone().lerp(coolColor, (blend - 0.5) * 2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.0,
    });
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
    // Quarry boulders — modest-sized rocks with subtle surface roughness
    const rockColors = [0x5d4037, 0x6d5040, 0x4d3530, 0x7a6050];
    const positions = [
      { x: -20, z: 10, s: 1.4 },
      { x: -22, z: 12, s: 1.0 },
      { x: -18, z: 11, s: 1.2 },
      { x: -21, z: 8, s: 0.9 },
      { x: -19, z: 13, s: 0.8 },
    ];
    for (const pos of positions) {
      const geo = new THREE.DodecahedronGeometry(pos.s, 0);
      // Gentle additive displacement for natural roughness
      const verts = geo.getAttribute('position');
      for (let i = 0; i < verts.count; i++) {
        const jitter = (Math.random() - 0.5) * 0.15 * pos.s;
        verts.setX(i, verts.getX(i) + jitter);
        verts.setY(i, verts.getY(i) + (Math.random() - 0.5) * 0.1 * pos.s);
        verts.setZ(i, verts.getZ(i) + jitter);
      }
      geo.computeVertexNormals();

      const rockMat = new THREE.MeshStandardMaterial({
        color: rockColors[Math.floor(Math.random() * rockColors.length)],
        roughness: 0.85 + Math.random() * 0.15,
        metalness: 0.02,
      });
      const rock = new THREE.Mesh(geo, rockMat);
      rock.position.set(pos.x, pos.s * 0.5, pos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }

    // Scattered rubble — small broken pieces
    const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.95, metalness: 0.0 });
    for (let i = 0; i < 8; i++) {
      const s = 0.12 + Math.random() * 0.2;
      const geo = new THREE.DodecahedronGeometry(s, 0);
      const rubble = new THREE.Mesh(geo, rubbleMat);
      rubble.position.set(
        -20 + (Math.random() - 0.5) * 8,
        s * 0.3,
        10 + (Math.random() - 0.5) * 6
      );
      rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rubble.castShadow = true;
      this.scene.add(rubble);
    }

    // Cut stone blocks — suggests quarry work in progress
    const cutBlockMat = new THREE.MeshStandardMaterial({ color: 0xc4a56a, roughness: 0.7, metalness: 0.02 });
    const cutBlocks = [
      { x: -16, z: 14, sx: 1.2, sy: 0.8, sz: 0.9, ry: 0.3 },
      { x: -24, z: 9, sx: 1.0, sy: 0.7, sz: 1.0, ry: -0.5 },
      { x: -18, z: 7, sx: 0.8, sy: 0.6, sz: 0.7, ry: 1.1 },
    ];
    for (const cb of cutBlocks) {
      const geo = new THREE.BoxGeometry(cb.sx, cb.sy, cb.sz);
      const block = new THREE.Mesh(geo, cutBlockMat);
      block.position.set(cb.x, cb.sy / 2, cb.z);
      block.rotation.y = cb.ry;
      block.castShadow = true;
      block.receiveShadow = true;
      this.scene.add(block);
    }
  }

  private createPalmFrondGeo(length: number, width: number): THREE.BufferGeometry {
    // Curved palm frond: a tapered plane that droops along its length
    const segments = 6;
    const verts: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Frond tapers from full width to a point
      const w = width * (1 - t * 0.85);
      // Droop curve: starts going up slightly, then arcs down
      const y = Math.sin(t * 0.4) * length * 0.15 - t * t * length * 0.35;
      const z = t * length;

      verts.push(-w / 2, y, z); // left edge
      verts.push(w / 2, y, z);  // right edge
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private createPalmTrees(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.9, metalness: 0.0 });
    const trunkRingMat = new THREE.MeshStandardMaterial({ color: 0x6b5010, roughness: 0.95, metalness: 0.0 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2d7a1e, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide });
    const frondDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e6a12, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });

    const palmPositions = [
      // Ring around oasis lake (40, 35)
      { x: 30, z: 32, h: 7, s: 1.0 },
      { x: 33, z: 25, h: 6.5, s: 0.95 },
      { x: 42, z: 23, h: 6, s: 0.85 },
      { x: 50, z: 30, h: 7.5, s: 1.05 },
      { x: 52, z: 38, h: 6.5, s: 0.9 },
      { x: 48, z: 45, h: 5.5, s: 0.8 },
      { x: 38, z: 47, h: 7, s: 1.0 },
      { x: 31, z: 42, h: 6, s: 0.85 },
      // Scattered elsewhere
      { x: -15, z: -22, h: 6.5, s: 0.85 },
      { x: -17, z: -25, h: 7.5, s: 1.1 },
      { x: 35, z: 5, h: 5.5, s: 0.8 },
      { x: -30, z: -15, h: 6, s: 0.9 },
    ];

    // Oasis basin params for palm Y placement (must match createOasis)
    const oasisCx = 40, oasisCz = 35, oasisBasinR = 16;
    const oasisBasinFloor = -0.3, oasisBasinRim = 0.8;

    for (const p of palmPositions) {
      const group = new THREE.Group();

      // Trunk — tapered cylinder with slight curve (lean)
      const trunkGeo = new THREE.CylinderGeometry(0.12 * p.s, 0.22 * p.s, p.h, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = p.h / 2;
      const leanX = (Math.random() - 0.5) * 0.2;
      const leanZ = (Math.random() - 0.5) * 0.15;
      trunk.rotation.z = leanX;
      trunk.rotation.x = leanZ;
      trunk.castShadow = true;
      group.add(trunk);

      // Trunk rings — horizontal bands for texture
      for (let ring = 0; ring < 4; ring++) {
        const ry = p.h * 0.2 + ring * (p.h * 0.18);
        const ringGeo = new THREE.TorusGeometry(0.17 * p.s, 0.03 * p.s, 4, 6);
        const ringMesh = new THREE.Mesh(ringGeo, trunkRingMat);
        ringMesh.position.y = ry;
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
      }

      // Crown — small coconut cluster at top
      const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5a3a0a, roughness: 0.7, metalness: 0.0 });
      for (let c = 0; c < 3; c++) {
        const ca = (c / 3) * Math.PI * 2;
        const coconut = new THREE.Mesh(
          new THREE.SphereGeometry(0.12 * p.s, 5, 5),
          coconutMat
        );
        coconut.position.set(
          Math.cos(ca) * 0.15 * p.s,
          p.h - 0.15,
          Math.sin(ca) * 0.15 * p.s
        );
        group.add(coconut);
      }

      // Palm fronds — long curved blades radiating outward and drooping
      const frondCount = 7 + Math.floor(Math.random() * 3);
      for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3;
        const frondLen = (2.5 + Math.random() * 1.0) * p.s;
        const frondW = (0.4 + Math.random() * 0.15) * p.s;
        const frondGeo = this.createPalmFrondGeo(frondLen, frondW);
        const mat = Math.random() > 0.4 ? frondMat : frondDarkMat;
        const frond = new THREE.Mesh(frondGeo, mat);

        frond.position.set(0, p.h + 0.1, 0);
        // Rotate to radiate outward from trunk top
        frond.rotation.y = angle;
        // Slight upward tilt variation
        frond.rotation.x = -(0.1 + Math.random() * 0.2);
        frond.castShadow = true;
        group.add(frond);
      }

      // Place palms on the basin slope if near oasis
      let py = 0;
      const dx = p.x - oasisCx, dz = p.z - oasisCz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < oasisBasinR) {
        const t = Math.min(dist / oasisBasinR, 1);
        py = oasisBasinFloor + t * t * (oasisBasinRim - oasisBasinFloor);
      }

      group.position.set(p.x, py, p.z);
      this.scene.add(group);
    }
  }

  private createOasis(): void {
    const cx = 40;
    const cz = 35;
    const basinRadius = 16;
    const basinFloor = -0.3; // Bowl center — slightly below ground
    const basinRim = 0.8;    // Bowl edge — slight raised lip
    const waterY = 0.5;      // Water surface — sits inside the bowl

    // Bowl-shaped basin mesh: high-res circle with vertices shaped into a bowl
    // This overlays the coarse terrain and creates a visible depression
    const basinGeo = new THREE.CircleGeometry(basinRadius, 32, 0, Math.PI * 2);
    basinGeo.rotateX(-Math.PI / 2);
    const basinPos = basinGeo.getAttribute('position');
    for (let i = 0; i < basinPos.count; i++) {
      const x = basinPos.getX(i);
      const z = basinPos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const t = Math.min(dist / basinRadius, 1); // 0 at center, 1 at edge
      const y = basinFloor + t * t * (basinRim - basinFloor);
      basinPos.setY(i, y);
    }
    basinGeo.computeVertexNormals();
    const basinMat = new THREE.MeshStandardMaterial({ color: 0xc4a060, roughness: 0.88, metalness: 0.0 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(cx, 0, cz);
    basin.receiveShadow = true;
    this.scene.add(basin);

    // Darker wet sand ring at water's edge
    const wetBankGeo = new THREE.RingGeometry(9.5, 11.5, 32);
    wetBankGeo.rotateX(-Math.PI / 2);
    const wetBankMat = new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.6, metalness: 0.05 });
    const wetBank = new THREE.Mesh(wetBankGeo, wetBankMat);
    wetBank.position.set(cx, waterY + 0.02, cz);
    this.scene.add(wetBank);

    // Helper: get ground Y at a given radius in the basin
    const groundY = (r: number): number => {
      const t = Math.min(r / basinRadius, 1);
      return basinFloor + t * t * (basinRim - basinFloor);
    };

    // Reeds — thin cylinders clustered around the water edge
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2e, roughness: 0.8, metalness: 0.0 });
    const darkReedMat = new THREE.MeshStandardMaterial({ color: 0x3a6a20, roughness: 0.85, metalness: 0.0 });
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.3;
      const r = 9.5 + Math.random() * 2.5;
      const height = 1.2 + Math.random() * 2.0;
      const reedGeo = new THREE.CylinderGeometry(0.03, 0.05, height, 4);
      const mat = Math.random() > 0.4 ? reedMat : darkReedMat;
      const reed = new THREE.Mesh(reedGeo, mat);
      reed.position.set(
        cx + Math.cos(angle) * r,
        groundY(r) + height / 2,
        cz + Math.sin(angle) * r
      );
      reed.rotation.z = (Math.random() - 0.5) * 0.25;
      reed.rotation.x = (Math.random() - 0.5) * 0.1;
      reed.castShadow = true;
      this.scene.add(reed);
    }

    // Grass tufts on the basin slope
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5a8a32, roughness: 0.85, metalness: 0.0 });
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 11.0 + Math.random() * 3.0;
      const turfGeo = new THREE.ConeGeometry(0.2 + Math.random() * 0.15, 0.6 + Math.random() * 0.4, 5);
      const turf = new THREE.Mesh(turfGeo, grassMat);
      turf.position.set(
        cx + Math.cos(angle) * r,
        groundY(r) + 0.2,
        cz + Math.sin(angle) * r
      );
      turf.castShadow = true;
      this.scene.add(turf);
    }

    // Rocks at water edge
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 0.8, metalness: 0.03 });
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 9.8 + Math.random() * 2.0;
      const s = 0.2 + Math.random() * 0.3;
      const rockGeo = new THREE.DodecahedronGeometry(s, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        cx + Math.cos(angle) * r,
        groundY(r) + s * 0.5,
        cz + Math.sin(angle) * r
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // Lotus flowers floating on the water surface
    const lotusColors = [0xff69b4, 0xff85c8, 0xffb6d9, 0xffffff];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 7.0;
      const lotusGeo = new THREE.CircleGeometry(0.15 + Math.random() * 0.1, 8);
      lotusGeo.rotateX(-Math.PI / 2);
      const lotusMat = new THREE.MeshStandardMaterial({
        color: lotusColors[Math.floor(Math.random() * lotusColors.length)],
        roughness: 0.4,
        metalness: 0.05,
      });
      const lotus = new THREE.Mesh(lotusGeo, lotusMat);
      lotus.position.set(cx + Math.cos(angle) * r, waterY + 0.05, cz + Math.sin(angle) * r);
      this.scene.add(lotus);
    }
    // Lotus pads (green discs, larger)
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7, metalness: 0.0 });
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 8.0;
      const padGeo = new THREE.CircleGeometry(0.25 + Math.random() * 0.2, 8);
      padGeo.rotateX(-Math.PI / 2);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(cx + Math.cos(angle) * r, waterY + 0.03, cz + Math.sin(angle) * r);
      pad.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(pad);
    }

    // Papyrus reed clusters — taller, denser than normal reeds
    const papyrusStemMat = new THREE.MeshStandardMaterial({ color: 0x3a8a28, roughness: 0.75, metalness: 0.0 });
    const papyrusHeadMat = new THREE.MeshStandardMaterial({ color: 0x6aaa42, roughness: 0.8, metalness: 0.0 });
    for (let cluster = 0; cluster < 6; cluster++) {
      const cAngle = (cluster / 6) * Math.PI * 2 + Math.random() * 0.5;
      const cR = 10.5 + Math.random() * 2.0;
      const count = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < count; j++) {
        const spread = 0.6;
        const px = cx + Math.cos(cAngle) * cR + (Math.random() - 0.5) * spread;
        const pz = cz + Math.sin(cAngle) * cR + (Math.random() - 0.5) * spread;
        const height = 2.5 + Math.random() * 1.5;
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.04, height, 4);
        const stem = new THREE.Mesh(stemGeo, papyrusStemMat);
        stem.position.set(px, groundY(cR) + height / 2, pz);
        stem.rotation.z = (Math.random() - 0.5) * 0.15;
        stem.castShadow = true;
        this.scene.add(stem);
        // Feathery top
        const headGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 6, 4);
        const head = new THREE.Mesh(headGeo, papyrusHeadMat);
        head.position.set(px, groundY(cR) + height, pz);
        head.scale.set(1, 0.6, 1);
        this.scene.add(head);
      }
    }

    // Extended ground cover — grass radiating outward beyond the basin
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 14.0 + Math.random() * 6.0;
      const turfGeo = new THREE.ConeGeometry(0.15 + Math.random() * 0.1, 0.4 + Math.random() * 0.3, 4);
      const turf = new THREE.Mesh(turfGeo, grassMat);
      turf.position.set(cx + Math.cos(angle) * r, 0.15, cz + Math.sin(angle) * r);
      this.scene.add(turf);
    }
  }

  private createDistantDunes(): void {
    const duneMat = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: 0.9, metalness: 0.0 });
    const duneGeo = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);

    const dunes = [
      { x: -80, z: -60, sx: 40, sy: 6, sz: 15 },
      { x: 70, z: -80, sx: 50, sy: 8, sz: 18 },
      { x: -50, z: 80, sx: 45, sy: 5, sz: 20 },
      { x: 90, z: 50, sx: 35, sy: 7, sz: 14 },
      { x: 0, z: -100, sx: 60, sy: 9, sz: 16 },
      { x: -100, z: 20, sx: 30, sy: 5, sz: 12 },
    ];

    // Single InstancedMesh with per-instance scale encoded in transform matrix
    const duneMesh = new THREE.InstancedMesh(duneGeo, duneMat, dunes.length);
    duneMesh.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Matrix4();
    const scale = new THREE.Matrix4();
    const translation = new THREE.Matrix4();

    for (let i = 0; i < dunes.length; i++) {
      const d = dunes[i];
      translation.makeTranslation(d.x, -0.5, d.z);
      rotation.makeRotationY(Math.random() * Math.PI);
      scale.makeScale(d.sx, d.sy, d.sz);
      matrix.copy(translation).multiply(rotation).multiply(scale);
      duneMesh.setMatrixAt(i, matrix);
    }
    duneMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(duneMesh);
  }

  private createDesertScrub(): void {
    const scrubColors = [
      { color: 0x8a7a3a, roughness: 0.9 },
      { color: 0x6b7a32, roughness: 0.85 },
      { color: 0x7a8a2a, roughness: 0.88 },
      { color: 0x5a6a28, roughness: 0.92 },
    ];
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x6a5a30, roughness: 0.95, metalness: 0.0 });

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
      const group = new THREE.Group();
      const colorConfig = scrubColors[Math.floor(Math.random() * scrubColors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color: colorConfig.color,
        roughness: colorConfig.roughness,
        metalness: 0.0,
      });

      // Main bush body — irregular icosahedron
      const bushGeo = new THREE.IcosahedronGeometry(p.s, 1);
      const verts = bushGeo.getAttribute('position');
      for (let i = 0; i < verts.count; i++) {
        verts.setX(i, verts.getX(i) + (Math.random() - 0.5) * 0.25 * p.s);
        verts.setY(i, Math.max(0, verts.getY(i) + (Math.random() - 0.5) * 0.2 * p.s));
        verts.setZ(i, verts.getZ(i) + (Math.random() - 0.5) * 0.25 * p.s);
      }
      bushGeo.computeVertexNormals();
      const bush = new THREE.Mesh(bushGeo, mat);
      bush.castShadow = true;
      group.add(bush);

      // Twigs/branches poking out — 3-5 per bush
      const branchCount = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branchCount; b++) {
        const angle = Math.random() * Math.PI * 2;
        const elevAngle = (Math.random() - 0.3) * Math.PI * 0.4;
        const branchLen = p.s * (0.5 + Math.random() * 0.8);
        const branchGeo = new THREE.CylinderGeometry(0.01 * p.s, 0.025 * p.s, branchLen, 3);
        const branch = new THREE.Mesh(branchGeo, branchMat);

        // Position branch to poke outward from bush center
        const dx = Math.cos(angle) * Math.cos(elevAngle) * p.s * 0.4;
        const dy = Math.sin(elevAngle) * p.s * 0.3 + branchLen * 0.3;
        const dz = Math.sin(angle) * Math.cos(elevAngle) * p.s * 0.4;
        branch.position.set(dx, dy, dz);
        branch.rotation.set(elevAngle, angle, Math.random() * 0.4 - 0.2);
        group.add(branch);
      }

      group.position.set(p.x, p.s * 0.3, p.z);
      this.scene.add(group);
    }
  }

  private createRockyOutcrops(): void {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9, metalness: 0.02 });
    const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.85, metalness: 0.03 });

    const outcrops = [
      { x: -60, z: 15, count: 5, baseScale: 2.5 },
      { x: 50, z: -60, count: 4, baseScale: 2.0 },
      { x: -35, z: -55, count: 6, baseScale: 1.8 },
      { x: 65, z: 40, count: 3, baseScale: 2.2 },
    ];

    for (const outcrop of outcrops) {
      for (let i = 0; i < outcrop.count; i++) {
        const s = outcrop.baseScale * (0.5 + Math.random() * 0.8);
        const geo = new THREE.DodecahedronGeometry(s, 1);
        // Distort vertices for natural look
        const verts = geo.getAttribute('position');
        for (let v = 0; v < verts.count; v++) {
          verts.setX(v, verts.getX(v) + (Math.random() - 0.5) * s * 0.3);
          verts.setY(v, verts.getY(v) * (0.5 + Math.random() * 0.5));
          verts.setZ(v, verts.getZ(v) + (Math.random() - 0.5) * s * 0.3);
        }
        geo.computeVertexNormals();
        const mat = Math.random() > 0.4 ? rockMat : darkRockMat;
        const rock = new THREE.Mesh(geo, mat);
        const rx = outcrop.x + (Math.random() - 0.5) * 6;
        const rz = outcrop.z + (Math.random() - 0.5) * 6;
        rock.position.set(rx, getTerrainHeight(rx, rz) + s * 0.3, rz);
        rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.2);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
      }
    }
  }

  private createNileRiver(): void {
    // Curved river ribbon along the north-east, connecting near the oasis
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x1a6b8a,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.8, metalness: 0.0 });
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9, metalness: 0.0 });

    // River path as a series of connected quads forming a curve
    const riverPoints: { x: number; z: number }[] = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const x = -100 + t * 260; // -100 to 160
      const z = 85 + Math.sin(t * Math.PI * 1.5) * 20 + Math.cos(t * Math.PI * 3) * 5;
      riverPoints.push({ x, z });
    }

    const riverWidth = 6;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < riverPoints.length; i++) {
      const p = riverPoints[i];
      // Perpendicular direction
      const next = riverPoints[Math.min(i + 1, riverPoints.length - 1)];
      const prev = riverPoints[Math.max(i - 1, 0)];
      const dx = next.x - prev.x;
      const dz = next.z - prev.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;

      const lx = p.x + nx * riverWidth / 2, lz = p.z + nz * riverWidth / 2;
      const rx = p.x - nx * riverWidth / 2, rz = p.z - nz * riverWidth / 2;
      positions.push(lx, getTerrainHeight(lx, lz) + 0.3, lz);
      positions.push(rx, getTerrainHeight(rx, rz) + 0.3, rz);

      if (i < riverPoints.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    riverGeo.setIndex(indices);
    riverGeo.computeVertexNormals();
    const river = new THREE.Mesh(riverGeo, riverMat);
    this.scene.add(river);

    // Mud banks along river edges
    for (let i = 0; i < riverPoints.length; i += 5) {
      const p = riverPoints[i];
      for (const side of [-1, 1]) {
        const next = riverPoints[Math.min(i + 1, riverPoints.length - 1)];
        const prev = riverPoints[Math.max(i - 1, 0)];
        const dx = next.x - prev.x;
        const dz = next.z - prev.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / len * side;
        const nz = dx / len * side;

        const bankGeo = new THREE.PlaneGeometry(3 + Math.random() * 2, 1.5 + Math.random());
        bankGeo.rotateX(-Math.PI / 2);
        const bank = new THREE.Mesh(bankGeo, Math.random() > 0.5 ? bankMat : mudMat);
        const bx = p.x + nx * (riverWidth / 2 + 1);
        const bz = p.z + nz * (riverWidth / 2 + 1);
        bank.position.set(bx, getTerrainHeight(bx, bz) + 0.05, bz);
        bank.rotation.y = Math.random() * Math.PI;
        bank.receiveShadow = true;
        this.scene.add(bank);
      }
    }

    // Reeds along river banks
    const riverReedMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2e, roughness: 0.8, metalness: 0.0 });
    for (let i = 0; i < riverPoints.length; i += 3) {
      const p = riverPoints[i];
      for (let j = 0; j < 2; j++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const next = riverPoints[Math.min(i + 1, riverPoints.length - 1)];
        const prev = riverPoints[Math.max(i - 1, 0)];
        const dx = next.x - prev.x;
        const dz = next.z - prev.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / len * side;
        const nz = dx / len * side;

        const height = 1.0 + Math.random() * 1.5;
        const reedGeo = new THREE.CylinderGeometry(0.02, 0.04, height, 4);
        const reed = new THREE.Mesh(reedGeo, riverReedMat);
        const rdx = p.x + nx * (riverWidth / 2 + 0.5 + Math.random());
        const rdz = p.z + nz * (riverWidth / 2 + 0.5 + Math.random());
        reed.position.set(rdx, getTerrainHeight(rdx, rdz) + height / 2, rdz);
        reed.rotation.z = (Math.random() - 0.5) * 0.2;
        reed.castShadow = true;
        this.scene.add(reed);
      }
    }
  }


  private createDesertRocks(): void {
    // Scattered desert rocks of varying sizes across the landscape
    const rockColors = [
      new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.9, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.85, metalness: 0.01 }),
      new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.92, metalness: 0.03 }),
      new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.88, metalness: 0.01 }),
    ];

    // Avoid oasis (40,35,r=20), pyramid (0,0,r=14), city (85,70,r=30)
    const exclusions = [
      { x: 40, z: 35, r: 22 },
      { x: 0, z: 0, r: 16 },
      { x: 85, z: 70, r: 35 },
    ];

    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;

      // Skip if inside exclusion zone
      let skip = false;
      for (const ex of exclusions) {
        const d = Math.sqrt((x - ex.x) ** 2 + (z - ex.z) ** 2);
        if (d < ex.r) { skip = true; break; }
      }
      if (skip) continue;

      const s = 0.1 + Math.random() * 0.5;
      const geo = new THREE.DodecahedronGeometry(s, 0);
      const mat = rockColors[Math.floor(Math.random() * rockColors.length)];
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(x, getTerrainHeight(x, z) + s * 0.3, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // Dried desert plants — sparse, wispy
    const driedPlantMat = new THREE.MeshStandardMaterial({ color: 0x8a7a3a, roughness: 0.95, metalness: 0.0 });
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;

      let skip = false;
      for (const ex of exclusions) {
        const d = Math.sqrt((x - ex.x) ** 2 + (z - ex.z) ** 2);
        if (d < ex.r) { skip = true; break; }
      }
      if (skip) continue;

      const height = 0.3 + Math.random() * 0.5;
      const plantGeo = new THREE.ConeGeometry(0.08 + Math.random() * 0.06, height, 5);
      const plant = new THREE.Mesh(plantGeo, driedPlantMat);
      plant.position.set(x, getTerrainHeight(x, z) + height / 2, z);
      plant.castShadow = true;
      this.scene.add(plant);
    }
  }

  private createDistanceFog(): void {
    // Subtle exponential fog that fades to sky-horizon color
    this.scene.fog = new THREE.FogExp2(0xd4a574, 0.004);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private setupFreeRoam(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.toggleFreeRoam();
      }
      // Escape exits free roam
      if (e.code === 'Escape' && this.freeRoam) {
        this.toggleFreeRoam();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    // Pointer lock for mouselook
    this.renderer.domElement.addEventListener('click', () => {
      if (this.freeRoam && !document.pointerLockElement) {
        this.renderer.domElement.requestPointerLock();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (this.freeRoam && document.pointerLockElement === this.renderer.domElement) {
        this.freeRoamYaw -= e.movementX * 0.002;
        this.freeRoamPitch -= e.movementY * 0.002;
        this.freeRoamPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.freeRoamPitch));
      }
    });
    document.addEventListener('pointerlockchange', () => {
      // If pointer lock was lost while in free roam, keep free roam active
      // User can click canvas to re-engage, or press F/Escape to exit
    });

    // UI toggle button
    this.createFreeRoamToggle();
  }

  private createFreeRoamToggle(): void {
    const btn = document.createElement('button');
    btn.id = 'pyr-freeroam-toggle';
    btn.textContent = '\u{1F3A5} Free Roam (F)';
    btn.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1001;
      background: rgba(20, 15, 10, 0.85);
      border: 1px solid #c9a84c55;
      color: #e8d5a3;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(201, 168, 76, 0.2)'; });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = this.freeRoam ? 'rgba(201, 168, 76, 0.25)' : 'rgba(20, 15, 10, 0.85)';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger pointer lock
      this.toggleFreeRoam();
    });
    document.body.appendChild(btn);
    this.freeRoamToggleEl = btn;
  }

  private toggleFreeRoam(): void {
    this.freeRoam = !this.freeRoam;

    if (this.freeRoam) {
      // Enter free roam: disable orbit, compute initial yaw/pitch from current view
      this.controls.enabled = false;

      // Derive yaw/pitch from current camera direction
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.freeRoamYaw = Math.atan2(-dir.x, -dir.z);
      this.freeRoamPitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

      // Exit pointer lock if we're toggling off
      if (this.freeRoamToggleEl) {
        this.freeRoamToggleEl.textContent = '\u{1F3A5} Orbit Mode (F)';
        this.freeRoamToggleEl.style.borderColor = '#c9a84c';
        this.freeRoamToggleEl.style.background = 'rgba(201, 168, 76, 0.25)';
      }
    } else {
      // Exit free roam: re-enable orbit, release pointer lock
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      this.controls.enabled = true;
      // Set orbit target to where we're currently looking
      const lookAt = new THREE.Vector3();
      this.camera.getWorldDirection(lookAt);
      lookAt.multiplyScalar(20).add(this.camera.position);
      lookAt.y = Math.max(0, lookAt.y);
      this.controls.target.copy(lookAt);
      this.controls.update();

      if (this.freeRoamToggleEl) {
        this.freeRoamToggleEl.textContent = '\u{1F3A5} Free Roam (F)';
        this.freeRoamToggleEl.style.borderColor = '#c9a84c55';
        this.freeRoamToggleEl.style.background = 'rgba(20, 15, 10, 0.85)';
      }
    }
  }

  private updateFreeRoam(delta: number): void {
    if (!this.freeRoam) return;

    // Movement speed: hold Shift to go faster
    const speed = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight') ? 40 : 15;
    const moveSpeed = speed * delta;

    // Direction vectors
    const forward = new THREE.Vector3(
      -Math.sin(this.freeRoamYaw) * Math.cos(this.freeRoamPitch),
      Math.sin(this.freeRoamPitch),
      -Math.cos(this.freeRoamYaw) * Math.cos(this.freeRoamPitch)
    ).normalize();

    const right = new THREE.Vector3(
      -Math.cos(this.freeRoamYaw),
      0,
      Math.sin(this.freeRoamYaw)
    ).normalize();

    // Horizontal forward (for WASD, ignore pitch so we don't dive into the ground)
    const flatForward = new THREE.Vector3(-Math.sin(this.freeRoamYaw), 0, -Math.cos(this.freeRoamYaw)).normalize();

    if (this.keysDown.has('KeyW')) this.camera.position.addScaledVector(flatForward, moveSpeed);
    if (this.keysDown.has('KeyS')) this.camera.position.addScaledVector(flatForward, -moveSpeed);
    if (this.keysDown.has('KeyA')) this.camera.position.addScaledVector(right, -moveSpeed);
    if (this.keysDown.has('KeyD')) this.camera.position.addScaledVector(right, moveSpeed);
    if (this.keysDown.has('Space')) this.camera.position.y += moveSpeed;
    if (this.keysDown.has('KeyC')) this.camera.position.y -= moveSpeed;

    // Keep above ground
    this.camera.position.y = Math.max(1.5, this.camera.position.y);

    // Apply look direction
    const lookTarget = new THREE.Vector3().copy(this.camera.position).add(forward);
    this.camera.lookAt(lookTarget);
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
    if (this.freeRoam) {
      this.updateFreeRoam(delta);
    } else {
      this.controls.update();
    }

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

    // Camera nudge (only in orbit mode)
    if (this._nudgeTarget && !this.freeRoam) {
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
