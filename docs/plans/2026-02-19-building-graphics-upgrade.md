# Building Graphics Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade all 26 structures from flat-colored primitives to textured, geometrically rich, atmospherically lit buildings.

**Architecture:** Five independent layers stacked on the existing InstancedMesh system: (1) procedural canvas textures applied to the shared material pool, (2) new geometry types cached alongside existing ones, (3) vertex-color AO baked into geometries, (4) per-structure point lights managed by a new effect class, (5) era-based weathering via material parameters.

**Tech Stack:** Three.js (MeshStandardMaterial, InstancedMesh, BufferGeometry, PointLight), HTML Canvas 2D for procedural textures.

---

## Codebase Context

- **`src/structures/BuildManager.ts`** — Manages pyramid + 26 structures. Has `GEOMETRY_CACHE` (6 geometry types), `eraMaterials[]` (36 MeshStandardMaterial), lazy InstancedMesh creation via `getOrCreateMesh()`. Per-instance colors via `setColorAt()`.
- **`src/structures/StructureRegistry.ts`** — Defines all 26 structures with `BlockSlot[]` arrays. Each slot has a `position` and optional `geometry` field (`BlockGeometry` union type).
- **`src/main.ts`** — Wires all systems. Effects follow pattern: `const effect = new Effect(scene)` then `effect.update(delta)` in render loop.
- **`src/effects/TorchFire.ts`** — Reference pattern for structure lights. Has `addTorch(position, intensity)` API and per-frame flicker.
- **`shared/types.ts`** — `ERA_VISUALS[]` (36 entries) with hue/saturation/lightness/roughness/metalness/emissiveIntensity per era.

---

### Task 1: Create TextureFactory — Procedural Stone Textures

**Files:**
- Create: `src/effects/TextureFactory.ts`

**Step 1: Create the TextureFactory module**

This module generates three texture types (sandstone, limestone, granite) plus their normal maps using Canvas 2D. Each texture is 256x256 pixels. The factory exposes a static API so textures are created once and shared.

Key implementation details:
- `generateSandstone()`: Tan base (#d4b896), Perlin-ish noise using layered `Math.sin` (no library needed), random small dark pores (2-3px circles), horizontal grain lines with slight waviness
- `generateLimestone()`: Light cream base (#e8dcc8), horizontal striations (low-opacity lines at varying intervals), smoother than sandstone (less noise amplitude)
- `generateGranite()`: Dark grey base (#4a4a4a), bright crystal speckles (random 1-2px white/pink dots at ~3% density), slight color variation patches
- `generateNormalMap(sourceCanvas)`: Takes any texture canvas, reads pixel brightness, computes x/y derivatives using Sobel-like kernel, encodes as RGB normal map (128,128,255 = flat, deviations in R/G)
- All textures use `THREE.CanvasTexture` with `wrapS = wrapT = RepeatWrapping` and `repeat.set(2, 2)` for tiling

```typescript
// src/effects/TextureFactory.ts
import * as THREE from 'three';

export type StoneType = 'sandstone' | 'limestone' | 'granite';

const TEX_SIZE = 256;
const textureCache = new Map<string, THREE.CanvasTexture>();

export class TextureFactory {
  static getTexture(type: StoneType): THREE.CanvasTexture { ... }
  static getNormalMap(type: StoneType): THREE.CanvasTexture { ... }
  private static generateSandstone(): HTMLCanvasElement { ... }
  private static generateLimestone(): HTMLCanvasElement { ... }
  private static generateGranite(): HTMLCanvasElement { ... }
  private static generateNormalFromCanvas(source: HTMLCanvasElement): HTMLCanvasElement { ... }
  private static noise2D(x: number, y: number): number { ... }
}
```

The `noise2D` function uses value noise via hashed grid points (no external library):
```typescript
private static noise2D(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const hash = (a: number, b: number) => {
    let h = a * 374761393 + b * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) / 2147483648;
  };
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy), n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1), n11 = hash(ix + 1, iy + 1);
  return n00 + (n10 - n00) * sx + (n01 - n00) * sy + (n00 - n10 - n01 + n11) * sx * sy;
}
```

**Step 2: Verify textures render**

Open browser at http://localhost:4201/ — textures won't be visible yet (not wired to materials), but check console for errors.

**Step 3: Commit**

```bash
git add src/effects/TextureFactory.ts
git commit -m "feat: add procedural TextureFactory for sandstone, limestone, granite textures"
```

---

### Task 2: Wire Textures into BuildManager Materials

**Files:**
- Modify: `src/structures/BuildManager.ts:99-108` (constructor material creation loop)

**Step 1: Import TextureFactory and assign textures to era materials**

Add import at top of BuildManager.ts:
```typescript
import { TextureFactory, StoneType } from '../effects/TextureFactory.js';
```

In the constructor, after creating each `MeshStandardMaterial`, assign `.map` and `.normalMap` based on era index:
- Eras 0-8 (sandstone era): `TextureFactory.getTexture('sandstone')` + normal map
- Eras 9-17 (limestone era): `TextureFactory.getTexture('limestone')` + normal map
- Eras 18-35 (granite/precious era): `TextureFactory.getTexture('granite')` + normal map

The era material creation loop becomes:
```typescript
for (let ei = 0; ei < ERA_VISUALS.length; ei++) {
  const era = ERA_VISUALS[ei];
  const stoneType: StoneType = ei < 9 ? 'sandstone' : ei < 18 ? 'limestone' : 'granite';
  this.eraMaterials.push(new THREE.MeshStandardMaterial({
    roughness: era.roughness,
    metalness: era.metalness,
    emissive: new THREE.Color().setHSL(era.hue, era.saturation, era.lightness * 0.3),
    emissiveIntensity: era.emissiveIntensity,
    map: TextureFactory.getTexture(stoneType),
    normalMap: TextureFactory.getNormalMap(stoneType),
    normalScale: new THREE.Vector2(0.3, 0.3),
  }));
}
```

**Important:** The existing geometries (BoxGeometry, CylinderGeometry) already have UVs generated by Three.js. The wedge geometry (`BufferGeometry` with manual vertices) does NOT have UVs — add UV coordinates to it in the `getBlockGeometry` function.

Add UVs to the wedge geometry after `geo.setAttribute('position', ...)`:
```typescript
const uvs = new Float32Array([
  // Front face triangle
  0, 0,  1, 0,  0, 1,
  // Back face triangle
  1, 0,  0, 0,  0, 1,
  // Bottom face (2 tris)
  0, 0,  1, 0,  1, 1,
  0, 0,  1, 1,  0, 1,
  // Slope face (2 tris)
  0, 1,  0, 0,  1, 0,
  0, 1,  1, 0,  1, 1,
  // Left face (2 tris)
  0, 0,  1, 0,  1, 1,
  0, 0,  1, 1,  0, 1,
]);
geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
```

**Step 2: Verify in browser**

Buildings should now have visible stone grain/texture instead of flat color. The per-instance color tinting from `setColorAt` blends multiplicatively with the texture.

**Step 3: Commit**

```bash
git add src/structures/BuildManager.ts
git commit -m "feat: wire procedural stone textures into era materials with UV support"
```

---

### Task 3: Add New Geometry Types

**Files:**
- Modify: `src/structures/StructureRegistry.ts:7` (BlockGeometry type)
- Modify: `src/structures/BuildManager.ts:11-58` (getBlockGeometry function)

**Step 1: Extend the BlockGeometry union type**

In `StructureRegistry.ts`, change:
```typescript
export type BlockGeometry = 'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab';
```
to:
```typescript
export type BlockGeometry = 'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab' | 'fluted-cylinder' | 'beveled-cube' | 'lotus-capital';
```

**Step 2: Add geometry creation in BuildManager.ts `getBlockGeometry()`**

Add three new cases before the default:

**Fluted cylinder** — 12 segments with alternating inner/outer radii:
```typescript
case 'fluted-cylinder': {
  const segments = 24; // 12 flutes × 2 vertices each
  const radiusTop: number[] = [];
  const radiusBot: number[] = [];
  for (let i = 0; i < segments; i++) {
    const flute = i % 2 === 0 ? 0.45 : 0.38; // Outer / groove
    radiusTop.push(flute);
    radiusBot.push(flute);
  }
  // Use LatheGeometry with fluted profile
  const points: THREE.Vector2[] = [];
  points.push(new THREE.Vector2(0.38, -0.5));
  points.push(new THREE.Vector2(0.45, -0.45));
  points.push(new THREE.Vector2(0.45, 0.45));
  points.push(new THREE.Vector2(0.38, 0.5));
  geo = new THREE.LatheGeometry(points, 12);
  break;
}
```

**Beveled cube** — box with chamfered edges using a custom BufferGeometry. Create 8 corner-cut vertices and triangulated faces. Simpler approach: use a BoxGeometry then apply a slight bevel via vertex displacement:
```typescript
case 'beveled-cube': {
  geo = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
  const pos = geo.attributes.position;
  const bevel = 0.06;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Pull corners inward
    const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
    const cornerDist = (ax > 0.4 ? 1 : 0) + (ay > 0.4 ? 1 : 0) + (az > 0.4 ? 1 : 0);
    if (cornerDist >= 2) {
      pos.setXYZ(i,
        x - Math.sign(x) * bevel * (ax > 0.4 ? 1 : 0),
        y - Math.sign(y) * bevel * (ay > 0.4 ? 1 : 0),
        z - Math.sign(z) * bevel * (az > 0.4 ? 1 : 0),
      );
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  break;
}
```

**Lotus capital** — wider flare with inward curve:
```typescript
case 'lotus-capital': {
  const profile: THREE.Vector2[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 (bottom) to 1 (top)
    // Lotus bud shape: narrow stem flaring to wide top with slight lip
    const r = 0.3 + 0.35 * Math.pow(t, 0.5) - (t > 0.85 ? (t - 0.85) * 0.5 : 0);
    const y = -0.2 + t * 0.4;
    profile.push(new THREE.Vector2(r, y));
  }
  geo = new THREE.LatheGeometry(profile, 12);
  break;
}
```

All three get cached in `GEOMETRY_CACHE` like existing types. Add UVs are auto-generated by LatheGeometry and BoxGeometry.

**Step 3: Commit**

```bash
git add src/structures/BuildManager.ts src/structures/StructureRegistry.ts
git commit -m "feat: add fluted-cylinder, beveled-cube, lotus-capital geometry types"
```

---

### Task 4: Apply New Geometries to Select Structures

**Files:**
- Modify: `src/structures/StructureRegistry.ts` (multiple generate functions)

**Step 1: Replace geometry types in structure generators**

Apply new geometries to these structures:

1. **Colonnade** (`generateColonnadeSlots`, line 139): Change `geometry: 'cylinder'` to `geometry: 'fluted-cylinder'` on the shaft blocks. Change `geometry: 'capital'` to `geometry: 'lotus-capital'`.

2. **Hypostyle Hall** (`generateHypostyleHallSlots`, line 496): Same changes — fluted cylinders for shafts, lotus capitals.

3. **Mortuary Temple** (`generateTempleSlots`, line 296): Change interior column `geometry: 'cylinder'` to `geometry: 'fluted-cylinder'`, and capitals to `geometry: 'lotus-capital'`. Change perimeter wall blocks (y >=1) to `geometry: 'beveled-cube'`.

4. **Valley Temple** (`generateValleyTempleSlots`, line 809): Interior columns get `'fluted-cylinder'` shafts and `'lotus-capital'` capitals. Perimeter walls get `'beveled-cube'`.

5. **Pylon Gate** (`generatePylonGateSlots`, line 427): Tower blocks (y >= 3) get `'beveled-cube'` for a more imposing look.

6. **Treasury** (`generateTreasurySlots`, line 902): Perimeter wall blocks at y >= 1 get `'beveled-cube'`.

7. **Shrine of Anubis** (`generateShrineOfAnubisSlots`, line 1022): Column cylinders become `'fluted-cylinder'`, capitals become `'lotus-capital'`.

8. **Cliff Temple** (`generateCliffTempleSlots`, line 1470): Facade wall blocks at y >= 4 get `'beveled-cube'`.

**Step 2: Verify in browser**

Columns should show visible fluting (grooved ridges). Capitals should have a subtle lotus-bud flare. Wall blocks on major buildings should have softly chamfered edges instead of perfectly sharp cubes.

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: apply fluted columns, lotus capitals, beveled walls to 8 structures"
```

---

### Task 5: Vertex-Based Ambient Occlusion

**Files:**
- Modify: `src/structures/BuildManager.ts` (new function + call in `getBlockGeometry`)

**Step 1: Add AO color attribute to all geometries**

After each geometry is created in `getBlockGeometry()`, before caching, apply vertex-based AO by adding a `color` attribute. This is a per-vertex darkening based on the vertex's Y position within the block:

Add a new function after `getBlockGeometry`:
```typescript
function applyVertexAO(geo: THREE.BufferGeometry): void {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normal = geo.attributes.normal;
    const ny = normal ? normal.getY(i) : 0;

    // Base brightness: slightly darker at bottom of block
    // y ranges from -0.5 to 0.5 for unit geometries
    const yNorm = (y + 0.5); // 0 at bottom, 1 at top
    let brightness = 0.85 + yNorm * 0.15; // 0.85 at bottom, 1.0 at top

    // Darken downward-facing normals (undersides)
    if (ny < -0.5) {
      brightness *= 0.7;
    }

    // Slight darkening on side faces near the bottom
    if (Math.abs(ny) < 0.5 && yNorm < 0.3) {
      brightness *= 0.9;
    }

    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
```

Call `applyVertexAO(geo)` on every geometry right before `GEOMETRY_CACHE.set(type, geo)`.

Then in the material creation, set `vertexColors: true` on all era materials. **Important:** When `vertexColors` is true, `setColorAt` on InstancedMesh multiplies with vertex colors. So the per-instance hue tinting and the AO darkening combine correctly.

Update the material creation in the constructor:
```typescript
this.eraMaterials.push(new THREE.MeshStandardMaterial({
  // ... existing properties ...
  vertexColors: true,
}));
```

**Step 2: Verify in browser**

Blocks should show subtle shading — slightly darker at the bottom edge of each block, creating the illusion of shadows in the gaps between stacked blocks.

**Step 3: Commit**

```bash
git add src/structures/BuildManager.ts
git commit -m "feat: add vertex-based ambient occlusion to all block geometries"
```

---

### Task 6: Create StructureLights Effect

**Files:**
- Create: `src/effects/StructureLights.ts`

**Step 1: Create the StructureLights class**

Follow the same pattern as `TorchFire.ts` — constructor takes `scene`, has an `update(delta, dayTime)` method, and a `notifyStructureBuilt(structureId)` method that BuildManager calls when a structure starts receiving blocks.

```typescript
// src/effects/StructureLights.ts
import * as THREE from 'three';

interface StructureLight {
  light: THREE.PointLight;
  structureId: string;
  baseIntensity: number;
  behavior: 'flicker' | 'pulse' | 'beacon' | 'static';
  angle?: number; // For beacon rotation
}

export class StructureLights {
  private scene: THREE.Scene;
  private lights: StructureLight[] = [];
  private activeStructures = new Set<string>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  notifyStructureBuilt(structureId: string, worldOffset: THREE.Vector3): void {
    if (this.activeStructures.has(structureId)) return;
    this.activeStructures.add(structureId);
    this.createLightsForStructure(structureId, worldOffset);
  }

  private createLightsForStructure(id: string, offset: THREE.Vector3): void { ... }
  // Contains switch on structure id:
  // 'altar' → 4 orange flicker lights at corners (offset ± 1 block at y=3.5)
  // 'sacred-lake' → 1 blue-green pulse light at center (y=0.5)
  // 'irrigation-canal' → 1 blue-green pulse light at center (y=0.5)
  // 'lighthouse' → 1 bright warm beacon light at top (y=13)
  // 'temple' → 1 warm static light inside courtyard (y=2)
  // 'valley-temple' → 1 warm static light inside (y=1.5)
  // 'worker-village' → 4 small warm static lights inside houses (y=1)
  // 'shrine-of-anubis' → 1 warm static light at center (y=2)

  update(delta: number, dayTime: number): void {
    // Night intensity multiplier: lights are brighter at night
    // dayTime cycles 0→1 where ~0.25-0.75 is night-ish
    const nightFactor = Math.sin(dayTime * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const intensityMult = 0.3 + nightFactor * 0.7; // 30% during day, 100% at night

    for (const sl of this.lights) {
      switch (sl.behavior) {
        case 'flicker':
          sl.light.intensity = sl.baseIntensity * intensityMult * (0.7 + Math.random() * 0.6);
          break;
        case 'pulse':
          sl.light.intensity = sl.baseIntensity * intensityMult * (0.8 + Math.sin(Date.now() * 0.002) * 0.2);
          break;
        case 'beacon':
          sl.angle = (sl.angle || 0) + delta * 1.5;
          sl.light.position.x += Math.cos(sl.angle) * 0.02;
          sl.light.position.z += Math.sin(sl.angle) * 0.02;
          sl.light.intensity = sl.baseIntensity * intensityMult;
          break;
        case 'static':
          sl.light.intensity = sl.baseIntensity * intensityMult;
          break;
      }
    }
  }
}
```

Light specs per structure:
| Structure | Color | Intensity | Distance | Decay | Behavior |
|-----------|-------|-----------|----------|-------|----------|
| altar (×4) | 0xff6600 | 1.0 | 8 | 2 | flicker |
| sacred-lake | 0x00bcd4 | 0.8 | 12 | 2 | pulse |
| irrigation-canal | 0x00bcd4 | 0.6 | 8 | 2 | pulse |
| lighthouse | 0xffd54f | 2.0 | 20 | 1.5 | beacon |
| temple | 0xffab40 | 0.5 | 6 | 2 | static |
| valley-temple | 0xffab40 | 0.4 | 5 | 2 | static |
| worker-village (×4) | 0xffcc80 | 0.3 | 4 | 2 | static |
| shrine-of-anubis | 0xffab40 | 0.5 | 6 | 2 | static |

**Step 2: Commit**

```bash
git add src/effects/StructureLights.ts
git commit -m "feat: add StructureLights effect with flicker, pulse, and beacon behaviors"
```

---

### Task 7: Wire StructureLights into Main and BuildManager

**Files:**
- Modify: `src/main.ts` (import + instantiation + render loop + structure completion hook)
- Modify: `src/structures/BuildManager.ts` (expose structure completion events)

**Step 1: Add a callback in BuildManager for structure starts**

In `BuildManager`, add a callback mechanism similar to `onBlockLand`. When the first block of a new structure is placed (in both `placeStructureBlockInstant` and `startStructureBlockAnimation`), fire a callback with the structure id and worldOffset:

```typescript
private onStructureStartCallbacks: ((id: string, offset: THREE.Vector3) => void)[] = [];

onStructureStart(cb: (id: string, offset: THREE.Vector3) => void): void {
  this.onStructureStartCallbacks.push(cb);
}
```

In `placeStructureBlockInstant` and `startStructureBlockAnimation`, after incrementing `structurePlacedCounts`, check if `placed === 1` (first block). If so, fire:
```typescript
const newPlaced = (this.structurePlacedCounts.get(structureIndex) || 0);
if (newPlaced === 1) {
  const structure = this.structures[structureIndex];
  for (const cb of this.onStructureStartCallbacks) {
    cb(structure.id, structure.worldOffset);
  }
}
```

**Step 2: Wire in main.ts**

Add after the torchFire instantiation:
```typescript
import { StructureLights } from './effects/StructureLights.js';

const structureLights = new StructureLights(sceneManager.scene);

buildManager.onStructureStart((id, offset) => {
  structureLights.notifyStructureBuilt(id, offset);
});
```

In the animate loop, after `torchFire.update(delta)`:
```typescript
structureLights.update(delta, dayTime);
```

**Step 3: Verify in browser**

When structures begin building, their associated lights should appear. At night, the altar should flicker orange, the sacred lake should glow blue-green, and the lighthouse should have a rotating beacon.

**Step 4: Commit**

```bash
git add src/main.ts src/structures/BuildManager.ts src/effects/StructureLights.ts
git commit -m "feat: wire StructureLights into build pipeline and render loop"
```

---

### Task 8: Material Weather & Age Effects

**Files:**
- Modify: `src/structures/BuildManager.ts` (randomBlockColor function + material roughness)

**Step 1: Add sand accumulation and weathering to block colors**

Modify `randomBlockColor` to accept the geometry type and add top-surface sand bias for early eras:

```typescript
private randomBlockColor(eraIndex: number, geoType: BlockGeometry = 'cube'): THREE.Color {
  const era = ERA_VISUALS[eraIndex];
  let hue = era.hue + (Math.random() - 0.5) * era.hueRange;
  let sat = era.saturation + (Math.random() - 0.5) * era.saturationRange;
  let light = era.lightness + (Math.random() - 0.5) * era.lightnessRange;

  // Sand accumulation: horizontal surfaces on early eras get warmer, lighter
  if (eraIndex < 12 && (geoType === 'slab' || geoType === 'half')) {
    hue = hue * 0.7 + 0.08 * 0.3; // Bias toward sandy tan
    sat *= 0.6; // Desaturate
    light = light * 0.8 + 0.75 * 0.2; // Lighten
  }

  // Edge wear on beveled cubes: slightly lighter overall
  if (geoType === 'beveled-cube') {
    light += 0.03;
  }

  return _tempColor.setHSL(hue, sat, light);
}
```

Update all call sites of `randomBlockColor` to pass the `geoType` parameter. There are two call sites:
- `placeStructureBlockInstant`: line 268 — already has `geoType` in scope
- `startStructureBlockAnimation`: line 391 — already has `geoType` in scope

**Step 2: Adjust roughness per era in material creation**

The ERA_VISUALS already have roughness values, but enforce a floor for early eras to ensure they look properly weathered:

In the material creation loop, after reading `era.roughness`:
```typescript
const roughness = ei < 6 ? Math.max(era.roughness, 0.75) : era.roughness;
```

**Step 3: Verify in browser**

Slab and half-block surfaces on early-era structures should appear slightly sandier/lighter. Beveled wall blocks should have marginally lighter coloring. Early buildings should look properly rough/weathered.

**Step 4: Commit**

```bash
git add src/structures/BuildManager.ts
git commit -m "feat: add sand accumulation, edge wear, and roughness floor for early eras"
```

---

### Task 9: Final Polish & Visual Verification

**Files:**
- Possibly tweak: `src/effects/TextureFactory.ts` (texture intensity/contrast)
- Possibly tweak: `src/structures/BuildManager.ts` (normal map strength, AO intensity)

**Step 1: Visual review checklist**

Open http://localhost:4201/ and verify:
- [ ] Sandstone texture visible on early-era pyramid blocks (grain lines, pores)
- [ ] Limestone texture on mid-era blocks (smoother, lighter)
- [ ] Granite texture on late-era blocks (dark with speckles)
- [ ] Fluted columns in Colonnade and Hypostyle Hall show visible grooves
- [ ] Lotus capitals have a wider, more ornate flare than plain cylinders
- [ ] Beveled-cube walls on temples have subtly chamfered edges
- [ ] AO darkening visible at base of stacked blocks
- [ ] Altar fire pits glow orange at night
- [ ] Sacred Lake has blue-green underglow
- [ ] Lighthouse beacon rotates
- [ ] Temple interiors have warm glow
- [ ] Slab surfaces on early structures look sand-dusted
- [ ] No console errors
- [ ] FPS stays above 30 on mid-range hardware

**Step 2: Tune if needed**

Common adjustments:
- If textures look too strong: reduce `normalScale` from `(0.3, 0.3)` to `(0.15, 0.15)`
- If AO is too dark: increase minimum brightness from 0.85 to 0.9
- If structure lights are too bright during day: adjust the `intensityMult` floor
- If fluted columns look too busy: reduce LatheGeometry segments from 12 to 8

**Step 3: Final commit**

```bash
git add -A
git commit -m "polish: tune texture intensity, AO strength, and lighting balance"
```
