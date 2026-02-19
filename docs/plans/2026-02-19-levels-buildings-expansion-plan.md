# Levels & Buildings Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Double milestones from 18 to 36, add 18 new structures with enhanced block geometry, and upgrade 5 existing structures.

**Architecture:** Extend the existing StructureRegistry + BuildManager pattern. Add a `geometry` field to BlockSlot so structures can mix block shapes (cubes, cylinders, wedges, etc). BuildManager creates InstancedMesh per geometry-type per era (lazy allocation). New milestones + ERA_VISUALS added to shared/types.ts. Atmosphere configs extended in SceneManager.

**Tech Stack:** Three.js, TypeScript, Vite

**Design Doc:** `docs/plans/2026-02-19-levels-buildings-expansion-design.md`

---

### Task 1: Add new milestones and ERA_VISUALS to shared/types.ts

**Files:**
- Modify: `shared/types.ts:22-41` (MILESTONES array)
- Modify: `shared/types.ts:55-92` (ERA_VISUALS array)

**Step 1: Add 18 new MILESTONES entries**

Append to the `MILESTONES` array after the Pylon Gate entry (line 40):

```typescript
  { name: 'Hypostyle Hall', xpThreshold: 260000, icon: '\u{1F3DB}' },
  { name: 'Sacred Lake', xpThreshold: 310000, icon: '\u{1F30A}' },
  { name: 'Worker\'s Village', xpThreshold: 365000, icon: '\u{1F3D8}' },
  { name: 'Granary of Plenty', xpThreshold: 425000, icon: '\u{1F33E}' },
  { name: 'Altar of Offerings', xpThreshold: 490000, icon: '\u{1F525}' },
  { name: 'Valley Temple', xpThreshold: 560000, icon: '\u{26E9}' },
  { name: 'Royal Treasury', xpThreshold: 640000, icon: '\u{1F48E}' },
  { name: 'Avenue of Sphinxes', xpThreshold: 725000, icon: '\u{1F981}' },
  { name: 'Shrine of Anubis', xpThreshold: 815000, icon: '\u{1F43A}' },
  { name: 'The Great Quarry', xpThreshold: 910000, icon: '\u{26CF}' },
  { name: 'Colossi of Memnon', xpThreshold: 1010000, icon: '\u{1F5FF}' },
  { name: 'Canopic Shrine', xpThreshold: 1120000, icon: '\u{1F3FA}' },
  { name: 'Irrigation Canal', xpThreshold: 1240000, icon: '\u{1F6BF}' },
  { name: 'Cliff Temple', xpThreshold: 1370000, icon: '\u{1F3D4}' },
  { name: 'Marketplace', xpThreshold: 1510000, icon: '\u{1F3EA}' },
  { name: 'Sarcophagus Chamber', xpThreshold: 1660000, icon: '\u{26B0}' },
  { name: 'Lighthouse of Pharos', xpThreshold: 1820000, icon: '\u{1F5FC}' },
  { name: 'Eternal City', xpThreshold: 2000000, icon: '\u{1F451}' },
```

**Step 2: Add 18 new ERA_VISUALS entries**

Append to the `ERA_VISUALS` array after the turquoise faience entry (line 91):

```typescript
  // Level 18: Hypostyle Hall — warm amber sandstone
  { hue: 0.09, hueRange: 0.02, saturation: 0.5, saturationRange: 0.1, lightness: 0.6, lightnessRange: 0.08, roughness: 0.45, metalness: 0.1, emissiveIntensity: 0.05 },
  // Level 19: Sacred Lake — deep aquamarine
  { hue: 0.52, hueRange: 0.03, saturation: 0.55, saturationRange: 0.1, lightness: 0.45, lightnessRange: 0.08, roughness: 0.35, metalness: 0.15, emissiveIntensity: 0.08 },
  // Level 20: Worker's Village — sun-baked terracotta
  { hue: 0.04, hueRange: 0.02, saturation: 0.55, saturationRange: 0.1, lightness: 0.5, lightnessRange: 0.08, roughness: 0.75, metalness: 0, emissiveIntensity: 0 },
  // Level 21: Granary of Plenty — golden wheat
  { hue: 0.11, hueRange: 0.02, saturation: 0.6, saturationRange: 0.1, lightness: 0.6, lightnessRange: 0.08, roughness: 0.6, metalness: 0.05, emissiveIntensity: 0.03 },
  // Level 22: Altar of Offerings — smoked obsidian
  { hue: 0.0, hueRange: 0.02, saturation: 0.1, saturationRange: 0.05, lightness: 0.25, lightnessRange: 0.06, roughness: 0.2, metalness: 0.4, emissiveIntensity: 0.1 },
  // Level 23: Valley Temple — cool grey granite
  { hue: 0.58, hueRange: 0.03, saturation: 0.12, saturationRange: 0.06, lightness: 0.5, lightnessRange: 0.08, roughness: 0.4, metalness: 0.2, emissiveIntensity: 0.03 },
  // Level 24: Royal Treasury — rich copper
  { hue: 0.06, hueRange: 0.02, saturation: 0.7, saturationRange: 0.1, lightness: 0.5, lightnessRange: 0.08, roughness: 0.25, metalness: 0.55, emissiveIntensity: 0.12 },
  // Level 25: Avenue of Sphinxes — rose sandstone
  { hue: 0.03, hueRange: 0.02, saturation: 0.4, saturationRange: 0.1, lightness: 0.6, lightnessRange: 0.08, roughness: 0.5, metalness: 0.1, emissiveIntensity: 0.05 },
  // Level 26: Shrine of Anubis — midnight blue-black
  { hue: 0.65, hueRange: 0.03, saturation: 0.4, saturationRange: 0.1, lightness: 0.2, lightnessRange: 0.06, roughness: 0.2, metalness: 0.35, emissiveIntensity: 0.15 },
  // Level 27: The Great Quarry — raw limestone
  { hue: 0.1, hueRange: 0.03, saturation: 0.2, saturationRange: 0.08, lightness: 0.65, lightnessRange: 0.1, roughness: 0.85, metalness: 0, emissiveIntensity: 0 },
  // Level 28: Colossi of Memnon — desert rose quartz
  { hue: 0.97, hueRange: 0.02, saturation: 0.3, saturationRange: 0.08, lightness: 0.55, lightnessRange: 0.08, roughness: 0.35, metalness: 0.2, emissiveIntensity: 0.08 },
  // Level 29: Canopic Shrine — jade green
  { hue: 0.38, hueRange: 0.03, saturation: 0.45, saturationRange: 0.1, lightness: 0.4, lightnessRange: 0.08, roughness: 0.3, metalness: 0.25, emissiveIntensity: 0.1 },
  // Level 30: Irrigation Canal — Nile blue-green
  { hue: 0.5, hueRange: 0.03, saturation: 0.5, saturationRange: 0.1, lightness: 0.5, lightnessRange: 0.08, roughness: 0.4, metalness: 0.15, emissiveIntensity: 0.06 },
  // Level 31: Cliff Temple — warm red sandstone
  { hue: 0.03, hueRange: 0.02, saturation: 0.5, saturationRange: 0.1, lightness: 0.45, lightnessRange: 0.08, roughness: 0.5, metalness: 0.15, emissiveIntensity: 0.05 },
  // Level 32: Marketplace — sun-bleached linen
  { hue: 0.1, hueRange: 0.02, saturation: 0.15, saturationRange: 0.06, lightness: 0.8, lightnessRange: 0.06, roughness: 0.65, metalness: 0, emissiveIntensity: 0 },
  // Level 33: Sarcophagus Chamber — dark basalt with gold veins
  { hue: 0.12, hueRange: 0.02, saturation: 0.3, saturationRange: 0.08, lightness: 0.25, lightnessRange: 0.06, roughness: 0.15, metalness: 0.5, emissiveIntensity: 0.18 },
  // Level 34: Lighthouse of Pharos — white marble
  { hue: 0.55, hueRange: 0.02, saturation: 0.08, saturationRange: 0.04, lightness: 0.9, lightnessRange: 0.04, roughness: 0.15, metalness: 0.1, emissiveIntensity: 0.05 },
  // Level 35: Eternal City — radiant white-gold
  { hue: 0.13, hueRange: 0.015, saturation: 0.85, saturationRange: 0.05, lightness: 0.8, lightnessRange: 0.04, roughness: 0.1, metalness: 0.7, emissiveIntensity: 0.3 },
```

**Step 3: Verify build**

Run: `cd /Users/craigverzosa/Documents/Personal/Vibes/Claude/Pyramid && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add 18 new milestones and ERA_VISUALS (levels 18-35)"
```

---

### Task 2: Add geometry type to BlockSlot and create geometry primitives

**Files:**
- Modify: `src/structures/StructureRegistry.ts:1-18` (BlockSlot interface + geometry constants)

**Step 1: Add geometry type and helper geometry factory**

At the top of StructureRegistry.ts, after the existing constants and before BlockSlot interface, add:

```typescript
export type BlockGeometry = 'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab';
```

Update the `BlockSlot` interface to:

```typescript
export interface BlockSlot {
  position: THREE.Vector3;
  placed: boolean;
  geometry?: BlockGeometry; // defaults to 'cube' if omitted
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors (geometry is optional, so existing slots compile)

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: add BlockGeometry type to BlockSlot interface"
```

---

### Task 3: Update BuildManager to support multiple geometry types

**Files:**
- Modify: `src/structures/BuildManager.ts` (multi-geometry InstancedMesh support)

This is the core architectural change. BuildManager currently creates one InstancedMesh per era per structure. We need one per geometry-type per era per structure (lazy, only for types used).

**Step 1: Add geometry factory and update mesh creation**

Add geometry creation helper near the top of BuildManager.ts (after the imports):

```typescript
import { getStructureRegistry, Structure, BlockSlot, BlockGeometry } from './StructureRegistry.js';

const GEOMETRY_MAP: Record<string, THREE.BufferGeometry> = {};

function getBlockGeometry(type: BlockGeometry = 'cube'): THREE.BufferGeometry {
  if (GEOMETRY_MAP[type]) return GEOMETRY_MAP[type];

  let geo: THREE.BufferGeometry;
  switch (type) {
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.45, 0.45, 1.0, 8);
      break;
    case 'wedge': {
      // Triangular prism: flat bottom, sloped top
      geo = new THREE.BufferGeometry();
      const verts = new Float32Array([
        // Front face (triangle)
        -0.5, -0.5, 0.5,   0.5, -0.5, 0.5,   0.5, 0.5, 0.5,
        // Back face (triangle)
        0.5, -0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, 0.5, -0.5,
        // Bottom face (quad as 2 tris)
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5, 0.5,   -0.5, -0.5, 0.5,
        // Slope face (quad as 2 tris)
        -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
        // Left face (quad as 2 tris)
        -0.5, -0.5, -0.5,   -0.5, -0.5, 0.5,   -0.5, 0.5, 0.5,
        -0.5, -0.5, -0.5,   -0.5, 0.5, 0.5,   -0.5, 0.5, -0.5,
        // Right face (triangle)
        0.5, -0.5, 0.5,   0.5, -0.5, -0.5,   0.5, 0.5, 0.5,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      break;
    }
    case 'half':
      geo = new THREE.BoxGeometry(1.0, 0.5, 1.0);
      break;
    case 'capital':
      geo = new THREE.CylinderGeometry(0.6, 0.45, 0.4, 8);
      break;
    case 'slab':
      geo = new THREE.BoxGeometry(1.0, 0.25, 1.0);
      break;
    case 'cube':
    default:
      geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      break;
  }
  GEOMETRY_MAP[type] = geo;
  return geo;
}
```

**Step 2: Refactor mesh storage to be per-geometry-type**

Replace the single-geo mesh storage with a nested structure. The key change is in the constructor and placement methods.

Current: `structureMeshes: Map<number, THREE.InstancedMesh[]>` (structureIndex -> era meshes)
New: `structureMeshes: Map<string, THREE.InstancedMesh>` (key = `${structureIndex}-${geoType}-${eraIndex}`)

And counts similarly: `structureInstanceCounts: Map<string, number>`

Update the constructor to scan each structure's slots for unique geometry types, then create InstancedMesh for each (geoType, era) combo.

Update `placeStructureBlockInstant` and `startStructureBlockAnimation` to look up the right mesh by slot's geometry type.

**Step 3: Verify build**

Run: `npx tsc --noEmit`

**Step 4: Manually verify**

Run: `npm run dev` and confirm existing structures still build correctly (since they default to 'cube' geometry).

**Step 5: Commit**

```bash
git add src/structures/BuildManager.ts
git commit -m "feat: support multiple geometry types in BuildManager"
```

---

### Task 4: Upgrade existing structures with enhanced geometry

**Files:**
- Modify: `src/structures/StructureRegistry.ts` (5 existing generators)

Upgrade these existing generators to use mixed geometry:

**Obelisk:** Add `geometry: 'half'` pyramidion cap on top layer.

**Sphinx:** Add `geometry: 'wedge'` for front paw taper blocks, `geometry: 'half'` for headdress blocks on top of head.

**Colonnade:** Change column shaft blocks to `geometry: 'cylinder'`, top blocks to `geometry: 'capital'`.

**Mortuary Temple:** Change inner sanctum vertical blocks to `geometry: 'cylinder'`.

**Pylon Gate:** Add `geometry: 'wedge'` blocks at tower tops for sloped crenellation.

**Step 1: Update each generator**

For each generator function, add `geometry` field to relevant BlockSlot entries. Example for colonnade:

```typescript
// Inside column generation loop:
for (let y = 0; y < 5; y++) {  // shaft
  slots.push({
    position: new THREE.Vector3(...),
    placed: false,
    geometry: 'cylinder',
  });
}
// Top of column:
slots.push({
  position: new THREE.Vector3(...),
  placed: false,
  geometry: 'capital',
});
```

**Step 2: Verify build + visual**

Run: `npx tsc --noEmit && npm run dev`
Visually confirm colonnade has cylindrical columns, obelisk has a cap, etc.

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: upgrade 5 existing structures with enhanced geometry"
```

---

### Task 5: Add new structure generators (batch 1: levels 18-23)

**Files:**
- Modify: `src/structures/StructureRegistry.ts`

Add 6 new generator functions and register them:

1. `generateHypostyleHallSlots` — 8 cylinder columns (3 high) in 2x4 grid, capital tops, slab roof beams connecting them. ~120 slots. Offset: (30, 0, 15).

2. `generateSacredLakeSlots` — Rectangular depression: outer ring of cubes 1 high, inner floor of slabs at y=-0.5, slab "water" surface. ~80 slots. Offset: (-25, 0, 20).

3. `generateWorkerVillageSlots` — 4 small houses (3x3x2 cubes each), wedge roof blocks on top. Arranged in 2x2 cluster with gaps. ~100 slots. Offset: (40, 0, 35).

4. `generateGranarySlots` — 3 cylinder silos (2 wide, 4 tall), half-block cap tops, cube walkway connecting bases. ~90 slots. Offset: (-40, 0, 35).

5. `generateAltarSlots` — 3-tier stepped platform (cubes), slab altar surface on top, cube fire-pit blocks at corners. ~70 slots. Offset: (35, 0, -35).

6. `generateValleyTempleSlots` — 6 cylinder columns inside cube walls (10x6 footprint), wedge entrance porch. ~200 slots. Offset: (-45, 0, -15).

Add each to `getStructureRegistry()` return array in order.

**Step 1: Implement all 6 generators**

Each follows the existing pattern: loop over positions, push BlockSlot with position + geometry type.

**Step 2: Verify build + visual**

Run: `npx tsc --noEmit && npm run dev`

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: add 6 new structures (Hypostyle Hall through Valley Temple)"
```

---

### Task 6: Add new structure generators (batch 2: levels 24-29)

**Files:**
- Modify: `src/structures/StructureRegistry.ts`

Add 6 more generators:

1. `generateTreasurySlots` — Thick-walled cube building (8x6), single doorway gap, internal cube shelves. ~130 slots. Offset: (50, 0, -10).

2. `generateAvenueOfSphinxesSlots` — 6 mini sphinx figures (each: 5 cube body + 2-high cube head) on slab pathway. Pathway is 1x20 slabs, sphinxes spaced along both sides. ~150 slots. Offset: (0, 0, 45).

3. `generateShrineOfAnubisSlots` — Small pavilion (6x6 cubes), 4 cylinder columns at corners, cube platform roof, wedge-tipped jackal ears (decorative blocks on top). ~100 slots. Offset: (-50, 0, -40).

4. `generateQuarrySlots` — Rectangular pit: step down 3 levels of cubes forming terraced walls, wedge ramp on one side. ~120 slots. Offset: (55, 0, 25).

5. `generateColossiSlots` — Two seated figures: each has 2x2 cube legs (2 high), 3x3 cube torso (3 high), 2x2 cube head (2 high). Seated on slab platform. ~160 slots. Offset: (-55, 0, -25).

6. `generateCanopicShrineSlots` — 4 cylinder jars (1 wide, 3 tall) with half-block lids, on cube platform. ~60 slots. Offset: (45, 0, -45).

**Step 1: Implement all 6 generators**

**Step 2: Verify build + visual**

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: add 6 new structures (Royal Treasury through Canopic Shrine)"
```

---

### Task 7: Add new structure generators (batch 3: levels 30-35)

**Files:**
- Modify: `src/structures/StructureRegistry.ts`

Add final 6 generators:

1. `generateIrrigationCanalSlots` — Long narrow channel: cube walls (2 high, 1 wide) running 20 long, slab floor, slab water surface inside. Small cube sluice gate. ~100 slots. Offset: (-30, 0, 50).

2. `generateCliffTempleSlots` — Tall flat cube facade (14 wide, 8 tall), 4 standing figures in front (each 1x1x4 cubes), wedge cornice at top. ~250 slots. Offset: (60, 0, -40).

3. `generateMarketplaceSlots` — 4 open stalls: each is 3x2 cube base, 4 cylinder corner posts, slab roof. Arranged in 2x2 grid. ~120 slots. Offset: (-60, 0, 40).

4. `generateSarcophagusChamberSlots` — Underground chamber: cube walls forming 6x4 room (3 high), slab ceiling, cube sarcophagus in center (3x1x1). Entrance corridor. ~110 slots. Offset: (40, 0, 50).

5. `generateLighthouseSlots` — Square cube base (4x4, 2 high), cylinder tower tapering from 2-wide to 1-wide over 10 layers, half-block cap, slab observation platform. ~140 slots. Offset: (-45, 0, 55).

6. No physical structure for "Eternal City" (level 35) — it's a completion achievement. Skip generator.

**Step 1: Implement 5 generators (skip Eternal City)**

**Step 2: Verify build + visual**

**Step 3: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: add 5 new structures (Irrigation Canal through Lighthouse)"
```

---

### Task 8: Extend SceneManager atmosphere configs

**Files:**
- Modify: `src/scene/SceneManager.ts:12-27` (ATMOSPHERE_CONFIGS array)

**Step 1: Extend ATMOSPHERE_CONFIGS to 36 entries**

Currently has 14 entries (indices 0-13). `setMilestoneLevel` clamps to `ATMOSPHERE_CONFIGS.length - 1`. We need at least 36 entries (indices 0-35).

Add entries 14-35. For levels 14+, all have innerGlow=true and capstoneBeacon=true. Gradually increase boost values:

```typescript
  // Levels 14-17 (fill in to match existing milestone count)
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  // Levels 18-23
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
  // Levels 30-35
  { midColorBoost: 0.96, ambientBoost: 0.48, sunIntensityBoost: 0.66, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.98, ambientBoost: 0.49, sunIntensityBoost: 0.68, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 1.0, ambientBoost: 0.5, sunIntensityBoost: 0.7, innerGlow: true, capstoneBeacon: true },
```

**Step 2: Verify build + visual at high milestone**

Run: `npx tsc --noEmit && npm run dev`

**Step 3: Commit**

```bash
git add src/scene/SceneManager.ts
git commit -m "feat: extend atmosphere configs for 36 milestone levels"
```

---

### Task 9: Final integration verification

**Files:** None (verification only)

**Step 1: Build check**

Run: `npx tsc --noEmit`
Expected: Clean compile

**Step 2: Dev server check**

Run: `npm run dev`
Verify in browser:
- Pyramid builds as before
- Existing structures (obelisk, sphinx, colonnade) show enhanced geometry
- New structures appear when blocks overflow
- Level names display correctly in HUD/sidebar
- Block colors match new ERA_VISUALS per milestone

**Step 3: Stress test**

Manually set high XP in server state to jump to milestone ~25-30 and confirm:
- Later structures render at correct positions
- No overlapping structures
- Performance remains smooth (check FPS)

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration adjustments for levels expansion"
```
