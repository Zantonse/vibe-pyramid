# Mega-Structures Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 35 new Egyptian structures (~51,850 block slots) to `StructureRegistry.ts`, extending buildable content from milestone 10 to roughly milestone 17.

**Architecture:** All changes go in a single file: `src/structures/StructureRegistry.ts`. Each structure needs a `generateXxxSlots(offset: THREE.Vector3): BlockSlot[]` function and a registry entry. The terrain-lift loop at the bottom of `getStructureRegistry()` handles Y positioning automatically. No other files change.

**Tech Stack:** Three.js (Vector3), existing BlockSlot/Structure types, existing 8 geometry types.

**Design doc:** `docs/plans/2026-02-28-mega-structures-design.md`

---

## Key Reference: Generator Function Pattern

Every generator follows this exact pattern. The implementing agent must use this as the template:

```typescript
function generateXxxSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const B = BLOCK_UNIT; // 1.05 (BLOCK_SIZE=1.0 + BLOCK_GAP=0.05)

  // Platform/floor: WxD at y=0
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * B + B / 2,
          BLOCK_SIZE / 2,           // y=0 layer
          offset.z - halfD + z * B + B / 2
        ),
        placed: false,
        geometry: 'slab',           // optional
      });
    }
  }

  // Walls: perimeter only at y>0
  for (let y = 1; y <= wallH; y++) {
    for (let x = 0; x < W; x++) {
      for (let z = 0; z < D; z++) {
        if (x > 0 && x < W - 1 && z > 0 && z < D - 1) continue; // skip interior
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * B + B / 2,
            y * B + BLOCK_SIZE / 2,
            offset.z - halfD + z * B + B / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Columns: fluted-cylinder shaft + lotus-capital top
  for (const cp of columnPositions) {
    for (let y = 1; y <= colH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cp.x * B + B / 2,
          y * B + BLOCK_SIZE / 2,
          offset.z - halfD + cp.z * B + B / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Capital on top
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + cp.x * B + B / 2,
        (colH + 1) * B + 0.2,
        offset.z - halfD + cp.z * B + B / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  return slots;
}
```

**Constants available:** `BLOCK_SIZE = 1.0`, `BLOCK_GAP = 0.05`, `BLOCK_UNIT = 1.05`

**Geometry types:** `'cube'` (default, omit), `'beveled-cube'`, `'cylinder'`, `'fluted-cylinder'`, `'lotus-capital'`, `'half'`, `'slab'`, `'wedge'`

## Key Reference: Registry Entry Pattern

Each structure entry in the `registry` array inside `getStructureRegistry()`:

```typescript
{
  id: 'structure-id',
  name: 'Display Name',
  icon: '🏛️',
  worldOffset: new THREE.Vector3(X, 0, Z),
  slots: generateXxxSlots(new THREE.Vector3(X, 0, Z)),
},
```

The `worldOffset` and the offset passed to the generator MUST be identical.

---

## Task 1: Inner Ring — Structures 35-39 (Small workshops)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 5 generator functions BEFORE the `getStructureRegistry()` function (around line 2670). Insert them after the last existing generator (`generateAbuSimbelSlots`).

Structures to implement:

1. **`generateEmbalmersWorkshopSlots`** (~180 slots) at `(-45, 0, 48)`
   - 8x6 building: slab floor (48), perimeter walls 3-high (72 beveled-cube), 4 interior slab tables (8), 6 cylinder jars along back wall (6), slab roof (48)

2. **`generateScribesAcademySlots`** (~200 slots) at `(55, 0, -40)`
   - 8x8: slab floor (64), 4 fluted-cylinder columns + capitals (20), perimeter walls 2-high (56 beveled-cube), raised 4x2 teaching platform 1-high (8), slab roof (64)

3. **`generateNilometerSlots`** (~120 slots) at `(48, 0, 52)`
   - 5 concentric square rings stepping down: 8x8 (perimeter 28), 6x6 (perimeter 20), 4x4 (perimeter 12), 2x2 (4), center cylinder column 5-high (5), plus slab platform surround

4. **`generateChariotStableSlots`** (~250 slots) at `(-48, 0, -45)`
   - 12x6: slab floor (72), 3-high walls on 3 sides — open front (66 beveled-cube), 5 partition walls 2x2-high (20), 8 cylinder posts along open front (24), slab roof (72)

5. **`generateBreweryBakerySlots`** (~200 slots) at `(60, 0, 25)`
   - Twin 6x4 buildings 3-apart: each has slab floor (24), 3-high walls (36 beveled-cube), 2 cylinder ovens (8 each), slab walkway bridge (12), slab roofs (48)

**Step 2:** Add 5 corresponding registry entries at the END of the `registry` array (after the abu-simbel entry, before the terrain-lift loop).

**Step 3:** Verify compilation.

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4:** Commit.

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: add inner ring structures 35-39 (workshops, ~950 slots)"
```

---

## Task 2: Inner Ring — Structures 40-44 (Barracks & small temples)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 5 generator functions after the ones from Task 1.

6. **`generateGuardBarracksSlots`** (~300 slots) at `(-55, 0, -20)`
   - 10x8: slab floor (80), perimeter walls 3-high (96 beveled-cube), corner watchtower extending to 5-high at (0,0) corner (8 extra), interior 2x4 bunk blocks (16), slab roof (80), courtyard: 6x4 walled yard attached on z-side (40)

7. **`generateSphinxAvenueGateSlots`** (~250 slots) at `(0, 0, 42)`
   - Central pylon gate: 2 tapered towers (8x2 base, 4-high tapering = ~48 beveled-cube each), slab lintel (8), 2 sphinx pedestals (4x2 base + 2x2x2 body + 1x1x2 head = 16 each), 4 cylinder flag poles 6-high (24), slab road (16)

8. **`generateSedFestivalPavilionSlots`** (~350 slots) at `(65, 0, -55)`
   - 12x10: slab floor (120), double ring of fluted-cylinder columns (16 outer + 8 inner, 3-high each + capitals = 96), raised 4x3 throne dais 2-high (24), slab roof ring (outer 44 edge slabs), wedge cornice blocks (16)

9. **`generateObservatorySlots`** (~300 slots) at `(-65, 0, 35)`
   - Cylindrical tower: 6x6 base platform (36 slab), circular-approximated walls 8-high — use 6x6 perimeter per level (160 beveled-cube), rooftop slab observation deck (36), 4 calibration obelisks at corners (4x 5-high = 20 cylinder), staircase ramp interior (20)

10. **`generateAnimalNecropolisSlots`** (~400 slots) at `(50, 0, -65)`
    - 4x4 grid of vault chambers (16 total): each is 2x2 base + 2x2x2 walls + slab lid (12 per vault = 192), central shrine 4x4: slab floor (16), walls 3-high (40), 4 cylinder jars (12), slab roof (16), walkways between vaults (slab paths, ~60)

**Step 2:** Add 5 registry entries.

**Step 3:** Verify: `npx tsc --noEmit`

**Step 4:** Commit.

```bash
git commit -m "feat: add inner ring structures 40-44 (barracks, temples, ~1600 slots)"
```

---

## Task 3: Mid Ring — Structures 45-50 (Temples & infrastructure)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 6 generator functions.

11. **`generatePriestsResidencesSlots`** (~450 slots) at `(-75, 0, 55)`
    - 6 houses in a 3x2 grid (each 4x3): slab floors (72), 2-high walls per house (216 beveled-cube), slab roofs (72), compound perimeter wall 2-high around all (80), central courtyard slab (12)

12. **`generateStoneWharfSlots`** (~400 slots) at `(80, 0, 40)`
    - 20x4 dock: slab floor (80), edge walls 1-high (44), 6 cylinder crane posts 4-high (24), loading ramp 4x3 wedge (12), 3 mooring bollards cylinder (6), storage shed: 6x3 with walls 2-high + slab roof (48)

13. **`generateTempleOfHathorSlots`** (~600 slots) at `(-80, 0, -40)`
    - 10x8 temple: slab floor (80), 3-high perimeter walls (96 beveled-cube), 6 Hathor columns on facade (fluted-cylinder 4-high + capital = 30), inner sanctuary 4x4 raised (32), slab roof (80), rooftop shrine 3x3x3 (27), entrance pylon 2 towers (48), wedge cornice (20)

14. **`generateWeavingMillSlots`** (~350 slots) at `(75, 0, -50)`
    - 8x8 main workshop: slab floor (64), 2-high walls (56 beveled-cube), 4 loom frame sets (cylinder uprights + slab crossbar = 6 each = 24), 3 dye vats (cylinder, 3 each = 9), slab roof (64), storage wing 4x4 (slab floor 16, walls 2-high 24, roof 16)

15. **`generateProcessionalWaySlots`** (~500 slots) at `(0, 0, -80)`
    - 30-long x 3-wide paved road: slab floor (90), flanking walls 2-high x 30-long (120 beveled-cube), 6 shrine alcoves spaced along road (each 2x2x3 = 12 each = 72), terminal gate pylon (2 towers, 4-high = 32), 10 pairs of small sphinx pedestals (2 blocks each = 40), slab capping on walls (60)

16. **`generateMilitaryFortressSlots`** (~800 slots) at `(-90, 0, -65)`
    - 14x14: slab floor (196), perimeter walls 4-high (200 beveled-cube), 4 corner towers 6-high (4x 2x2x2 extra above wall = 64), gatehouse 4x3x5 (36), inner barracks 8x4: floor + 2-high walls + roof (80), parade ground slab (48), armory 4x4: floor + walls + roof (56)

**Step 2:** Add 6 registry entries.

**Step 3:** Verify: `npx tsc --noEmit`

**Step 4:** Commit.

```bash
git commit -m "feat: add mid ring structures 45-50 (temples, fortress, ~3100 slots)"
```

---

## Task 4: Mid Ring — Structures 51-56 (Large temples & harbor)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 6 generator functions.

17. **`generateKarnakPrecinctWallSlots`** (~1000 slots) at `(95, 0, -30)`
    - 20x20 enclosure: thick walls (3 wide, 4 high). Outer perimeter per y-level = 20x2 + 18x2 = 76, times 3 wide = 228 per level, times 4 = 912. Minus 2 gate openings (4-wide x 4-high x 3-deep = 48 each removed). Add gate frame blocks.

18. **`generateTempleOfPtahSlots`** (~700 slots) at `(-85, 0, 70)`
    - Traditional Egyptian temple layout: entrance pylon 6-wide x 5-high (60), open court 12x6 slab floor (72) + 2-high court walls (56), hypostyle section 12x4 with 8 columns 4-high + capitals (40), inner sanctum 4x4x3 (48), slab roofs over hypostyle and sanctum (64), perimeter walls 3-high over full 12x10 footprint (176)

19. **`generateRoyalGranaryComplexSlots`** (~600 slots) at `(90, 0, 65)`
    - Shared slab platform 16x8 (128), 8 silos: cylinder 6-high (48 total) + half-block caps (8), administrative office 4x4: floor (16) + walls 3-high (36) + slab roof (16), connecting slab walkways (24), 4 corner guard posts cylinder 3-high (12)

20. **`generateHatshepsutTerraceSlots`** (~1200 slots) at `(-100, 0, -85)`
    - 3 ascending terraces connected by ramps:
      - Terrace 1 (bottom): 16x8 slab floor (128) + colonnade facade 16 columns 3-high + capitals (64) + back wall 16x3 (48)
      - Terrace 2: 12x6, raised 3 blocks, same pattern (floor 72 + columns 48 + wall 36)
      - Terrace 3 (top): 8x4, raised 6 blocks (floor 32 + columns 32 + wall 24)
      - 2 ramps connecting terraces: 4-wide x 3-long slab each (24)
      - Central sanctuary at top: 4x4x4 (48)

21. **`generateNileHarborSlots`** (~1000 slots) at `(105, 0, 50)`
    - L-shaped dock: main pier 24x6 (slab floor 144 + edge walls 1-high 56) + perpendicular arm 12x6 (floor 72 + walls 32), 3 warehouses (each 6x4: floor 24 + walls 3-high 54 + roof 24 = 102 x 3 = 306), loading ramps 3x wedge (18), crane cylinders 6x4-high (24), mooring bollards (12)

22. **`generateValleyOfKingsEntranceSlots`** (~800 slots) at `(-95, 0, 90)`
    - Cliff face: 16-wide x 10-high back wall (160), front decorative layer 16x10 minus 4 tomb entrance openings (each 2-wide x 3-high = 6 gaps = 24, so 136), 4 guardian statues flanking entrances (each 1x1x4 beveled-cube = 16), interior tomb corridors: 4x (3-long x 2-wide x 3-high = 18 each = 72), slab path approach 16x4 (64), flanking walls 2-high x 16 (64)

**Step 2:** Add 6 registry entries.

**Step 3:** Verify: `npx tsc --noEmit`

**Step 4:** Commit.

```bash
git commit -m "feat: add mid ring structures 51-56 (large temples, harbor, ~5300 slots)"
```

---

## Task 5: Outer Ring — Structures 57-61 (Mega temples)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 5 generator functions.

23. **`generateTempleOfLuxorSlots`** (~1500 slots) at `(115, 0, -70)`
    - 16x12 complex: entrance pylon 2 towers (each 3x2x6 tapered = 56), peristyle court 12x8 with 20 columns around perimeter (3-high + capital = 80), double colonnade hall 8x6 with 12 columns (4-high + capital = 60), inner chambers 3 rooms each 4x4x3 (144), slab floors throughout (192), perimeter walls 4-high (192), slab roofs over halls (128)

24. **`generateGreatEnclosureWallSlots`** (~1400 slots) at `(-115, 0, -50)`
    - 28x28 perimeter wall: 4 blocks thick, 5 blocks high. Per y-level, outer ring 28x28 minus 24x24 = 208 blocks. Times 5 = 1040. Plus 4 monumental gates (each gate: gap 4-wide x 5-high, flanking pylon towers 2x2x6 = 24 per gate x 4 = 96). Interior pathway slab ring (100)

25. **`generatePharaohMortuaryComplexSlots`** (~1800 slots) at `(120, 0, 80)`
    - Causeway: 20-long x 2-wide slab + 2-high flanking walls (120), valley temple 8x6 (floor 48 + walls 3-high 72 + 4 columns 24 + roof 48 = 192), mortuary temple 12x10 (floor 120 + walls 4-high 152 + 8 columns 40 + inner sanctum 36 + roof 120 = 468), false door panels 6x wedge (18)

26. **`generateNecropolisDistrictSlots`** (~2000 slots) at `(-120, 0, 75)`
    - Grid of 20 mastabas (4x5 layout, each 4x3x2 = 24 blocks per mastaba = 480), 4 shaft tombs (each 3x3 opening + 4-deep shaft = 33 per tomb = 132), offering chapels 4x (3x3x3 = 27 each = 108), perimeter wall around district 24x20 x 2-high (168), slab pathways grid (120), central memorial obelisk 1x1x10 (10)

27. **`generateTempleOfAmunRaSlots`** (~2500 slots) at `(130, 0, -40)`
    - 20x16 mega-temple: first pylon (2 towers 4x3x7 = 168), great court 16x10 slab floor (160) + perimeter walls 4-high (192), second pylon (2 towers 3x2x6 = 72), hypostyle hall 12x8 with 24 columns (6-high fluted-cylinder + capital = 168), slab architraves between columns (48), 3 inner sanctuaries (each 4x4x4 = 192), approach avenue slab 10x3 (30), 6 obelisks cylinder 8-high (48)

**Step 2:** Add 5 registry entries.

**Step 3:** Verify: `npx tsc --noEmit`

**Step 4:** Commit.

```bash
git commit -m "feat: add outer ring structures 57-61 (mega temples, ~9200 slots)"
```

---

## Task 6: Outer Ring — Structures 62-65 (Palace & halls)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 4 generator functions.

28. **`generateRoyalPalaceComplexSlots`** (~2800 slots) at `(-130, 0, -80)`
    - 20x18 compound: slab floor (360), perimeter walls 4-high thick (2-wide): outer ring minus inner ring per level = ~144 per level x 4 = 576, throne hall 8x6 interior with 6 columns 5-high + capitals (36), harem quarters: 3 rooms 4x3x3 (108), admin wing 6x4x3 (72), garden courtyard 6x6 slab floor + 4 cylinder planters (40), entrance colonnade 8 columns (40), slab roofs over interior buildings (240)

29. **`generateSacredHarborOfAmunSlots`** (~2000 slots) at `(135, 0, 60)`
    - T-shaped lake: main body 20x8 slab floor (160) + 2-high stone quay walls around perimeter (104), cross arm 12x8 slab (96) + quay walls (72), island barque shrine 6x4 in center of main body: raised platform (24) + 4 columns (20) + shrine 2x2x3 (12) + slab roof (24), approach ramp slab (20), 4 mooring posts cylinder (16)

30. **`generateFestivalHallThutmoseSlots`** (~2200 slots) at `(-135, 0, 40)`
    - 18x14 hall: slab floor (252), tent-pole columns (inverted taper — use cylinder 5-high + lotus-capital, 20 columns in 4x5 grid = 120), clerestory walls: outer walls 5-high (240 beveled-cube), inner raised walls above columns 2-high partial (72), rear chapel 6x4x4 (96), slab roof (252), entrance porch 6x3 with 4 columns (24)

31. **`generateKarnakHypostyleSlots`** (~3500 slots) at `(145, 0, -20)`
    - 20x14 forest of columns: slab floor (280), 70 columns in ~10x7 grid (each 6-high fluted-cylinder + capital = 490), slab architraves connecting column tops in rows and cols (~120), perimeter walls 6-high (384 beveled-cube), clerestory upper walls 2 extra rows of high walls (128), slab roof sections (280), entrance/exit gaps in walls

**Step 2:** Add 4 registry entries.

**Step 3:** Verify: `npx tsc --noEmit`

**Step 4:** Commit.

```bash
git commit -m "feat: add outer ring structures 62-65 (palace, halls, ~10500 slots)"
```

---

## Task 7: Outer Ring — Structures 66-69 (The finale mega-builds)

**File:** `src/structures/StructureRegistry.ts`

**Step 1:** Add 4 generator functions. These are the largest and most complex.

32. **`generateGreatNilePortSlots`** (~4000 slots) at `(-145, 0, -30)`
    - 24x20 district: main dock 24x4 slab (96) + quay walls (52), 4 warehouses (each 6x4: floor 24 + walls 3-high 54 + roof 24 = 408 total), customs house 8x6 (floor 48 + walls 4-high 96 + columns 4x4 20 + roof 48 = 212), merchant housing: 8 units 3x3 each (floor 9 + walls 2-high 18 + roof 9 = 288), harbor master tower 4x4x8 (128), connecting slab streets (180), perimeter wall 24x20 3-high (372)

33. **`generateTempleOfDenderaSlots`** (~3000 slots) at `(150, 0, 45)`
    - 22x16 compound: outer enclosure wall 3-high (216), main temple 14x10 (floor 140 + walls 4-high 176 + 12 columns 5-high + capital 72 + inner sanctum 4x4x4 48 + roof 140 = 576), birth house 8x6 (floor 48 + walls 3-high 72 + 4 columns 20 + roof 48 = 188), sacred lake 6x6 slab depression (36 + walls 24), sanatorium 6x4 (similar to birth house ~120), slab pathways (100)

34. **`generateGrandNecropolisSlots`** (~5000 slots) at `(-150, 0, 60)`
    - 30x24 burial district: 40 mastabas in 8x5 grid (each 3x2x2 = 12 blocks = 480), 8 rock-cut tombs (each: cliff face 4x5 = 20 + corridor 2x3x3 = 18 = 304 total), 4 mortuary temples (each 6x4: floor + walls 3-high + 2 columns + roof = 88 each = 352), funerary gardens: 6 areas of 4x4 slab (96), perimeter wall 30x24 x 3-high (312), processional avenue 24-long slab (72), offering shrines 8x (2x2x3 = 12 each = 96)

35. **`generateThebanAcropolisSlots`** (~8000 slots) at `(0, 0, -150)`
    - 30x30 hilltop complex:
      - Base terrace: 30x30 slab floor (900), perimeter wall 4-high (456 beveled-cube)
      - Temple A (center): 14x10 (floor 140 + walls 5-high 220 + 16 columns 5-high + caps 96 + inner sanctum 48 + roof 140 = 644)
      - Temple B (east): 10x8 (floor 80 + walls 4-high 128 + 8 columns + caps 48 + sanctum 32 + roof 80 = 368)
      - Temple C (west): 10x8 (same as B = 368)
      - Monumental stairway: 6-wide x 15-long ascending (90 slab + 60 side walls = 150)
      - 6 colossal statues (each 2x2x8 beveled-cube = 32 each = 192)
      - Connecting colonnades between temples: 2x (10-long, 8 columns + capitals + slab walkway = 60 each = 120)
      - Inner courtyard slab (200)
      - 4 corner obelisks (cylinder 10-high = 40)

**Step 2:** Add 4 registry entries.

**Step 3:** Verify: `npx tsc --noEmit` AND `npx vite build`

**Step 4:** Commit.

```bash
git commit -m "feat: add outer ring structures 66-69 (finale mega-builds, ~20000 slots)"
```

---

## Task 8: Final verification & push

**Step 1:** Run full type check and production build.

```bash
npx tsc --noEmit
npx vite build
```

Both must pass with no errors.

**Step 2:** Verify total slot count. Add a temporary console.log in getStructureRegistry:

```typescript
// At end of getStructureRegistry(), before return:
const totalSlots = registry.reduce((sum, s) => sum + s.slots.length, 0);
console.log(`Total structure slots: ${totalSlots}`);
```

Run `npx vite build` — check the console output. The total should be roughly 50,000-55,000 (the 35 new structures). Remove the console.log after verifying.

**Step 3:** Push.

```bash
git push
```

---

## Notes for the implementing agent

- **Slot counts are approximate targets.** The actual count for each structure depends on the exact geometry choices. Being within ±20% of the target is fine. Don't over-engineer to hit exact numbers.
- **Avoid overlapping world positions.** Each structure's worldOffset is chosen to avoid existing structures. Don't change these coordinates.
- **Use the existing geometry patterns.** Study `generateTempleSlots`, `generateEternalCitySlots`, and `generateAbuSimbelSlots` as references for how to build walls, columns, roofs, and pylons.
- **The terrain-lift loop handles Y.** Design everything at y=0. The loop at the end of `getStructureRegistry()` raises all slots to sit on the terrain surface.
- **No changes to any other file.** This is 100% contained in `StructureRegistry.ts`.
- **Each task should compile independently.** If you hit a type error, fix it before moving on.
