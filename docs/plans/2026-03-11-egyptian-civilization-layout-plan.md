# Egyptian Civilization Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reposition all structures in StructureRegistry.ts into a historically-inspired five-zone Egyptian civilization layout, consolidate 5 redundant structures, and adjust terrain flattening zones.

**Architecture:** Edit `worldOffset` coordinates for all structures in `getStructureRegistry()`, remove 5 structures and merge their slot generators into consolidated structures, update terrain flatten zones in `terrainHeight.ts` and `SceneManager.ts`.

**Tech Stack:** TypeScript, Three.js (Vector3 coordinates)

**Reference files:**
- Design doc: `docs/plans/2026-03-11-egyptian-civilization-layout-design.md`
- Structure registry: `src/structures/StructureRegistry.ts` (lines 9319–9811)
- Terrain height: `src/scene/terrainHeight.ts`
- Scene manager terrain: `src/scene/SceneManager.ts` (terrain creation section)

---

## Task 1: Update Terrain Flattening Zones

The new layout spreads structures differently. We need to update the flattened zones so buildings don't sit on bumpy terrain.

**Files:**
- Modify: `src/scene/terrainHeight.ts`
- Modify: `src/scene/SceneManager.ts` (the matching terrain displacement — search for `OASIS_CX` or the same flatten logic)

**Step 1: Update terrainHeight.ts**

Replace the constants and flatten logic. The new zones are:

```typescript
// Old zones:
// const OASIS_CX = 40, OASIS_CZ = 35, OASIS_R = 20;
// const CITY_CX = 86, CITY_CZ = 68, CITY_R = 45;
// const PYRAMID_R = 14;

// New zones (match the 5-zone layout):
const PYRAMID_R = 35;              // Sacred core — expanded from 14 to cover Zone 1
const OASIS_CX = 40, OASIS_CZ = 35, OASIS_R = 20;  // Oasis unchanged
const CITY_CX = 85, CITY_CZ = 55, CITY_R = 50;      // Civic quarter — shifted slightly south, wider
const HARBOR_CX = 80, HARBOR_CZ = 78, HARBOR_R = 35; // Harbor district along Nile
const NECRO_CX = 0, NECRO_CZ = -100, NECRO_R = 60;   // Southern necropolis
```

Add two new flatten sections in the `getTerrainHeight` function for the harbor and necropolis zones, following the same pattern as existing flatten code.

For HARBOR zone:
```typescript
const hDist = Math.sqrt((x - HARBOR_CX) ** 2 + (z - HARBOR_CZ) ** 2);
if (hDist < HARBOR_R) {
  y *= Math.max(0, (hDist - 20) / (HARBOR_R - 20));
}
```

For NECRO zone:
```typescript
const nDist = Math.sqrt((x - NECRO_CX) ** 2 + (z - NECRO_CZ) ** 2);
if (nDist < NECRO_R) {
  y *= Math.max(0, (nDist - 40) / (NECRO_R - 40));
}
```

Also update the pyramid flatten radius — change `(pDist - 6) / (PYRAMID_R - 6)` so the inner flat zone scales with the larger radius. Use `(pDist - 10) / (PYRAMID_R - 10)`.

**Step 2: Update SceneManager.ts**

The terrain vertex shader/displacement in `SceneManager.createTerrain()` must match `terrainHeight.ts` exactly. Search for the matching flatten logic (look for `OASIS_CX`, `PYRAMID_R`, or the same sine formulas) and apply identical changes.

**Step 3: Verify terrain loads**

```bash
cd /Users/craigverzosa/Documents/Personal/Vibes/Claude/Pyramid && npm run dev
```

Open in browser. Verify: flat area around pyramid is wider, flat zones visible near the Nile (z~78) and southern axis (z~-100). No terrain spikes inside where buildings will go.

**Step 4: Commit**

```bash
git add src/scene/terrainHeight.ts src/scene/SceneManager.ts
git commit -m "feat: expand terrain flattening zones for 5-zone civilization layout"
```

---

## Task 2: Consolidate 5 Redundant Structures

Remove 5 structures and merge their slot generators into enhanced versions.

**Files:**
- Modify: `src/structures/StructureRegistry.ts`

**Merges:**

| Remove | Keep (rename if needed) | Action |
|--------|------------------------|--------|
| `Sacred Harbor of Amun` (line ~9764) | Rename `Nile Harbor` → `Grand Harbor` | Combine slots from Sacred Harbor + Great Nile Port into Nile Harbor's generator |
| `Great Nile Port` (line ~9785) | (merged into Grand Harbor above) | Remove entry |
| `Royal Granary Complex` (line ~9694) | Rename `Granary` → `Royal Granary` | Combine slots |
| `Grand Necropolis` (line ~9799) | Rename `Necropolis District` → `Grand Necropolis` | Combine slots |
| `Military Fortress` (line ~9673) | Rename `Guard Barracks` → `Military Garrison` | Combine slots |
| `Avenue of Sphinxes` (line ~9435) | Rename `Processional Way` → `Grand Processional Avenue` | Combine slots |

**Step 1: For each merge pair:**

1. Find the `generate*Slots(offset)` function for the structure being removed
2. Copy its slot generation logic into the kept structure's generator (append the slots, adjusting relative positions so the combined structure is coherent)
3. Remove the entry from the `getStructureRegistry()` array
4. Update the kept structure's `name` and `id` fields
5. Update the kept structure's `icon` if the removed one had a better icon

**Step 2: Verify the registry array has 64 entries**

Add a quick count check: search for `{` patterns in the registry array, or count manually.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: consolidate 5 redundant structures (69→64)"
```

---

## Task 3: Reposition Zone 1 — Sacred Monumental Core

Update `worldOffset` for all Zone 1 structures.

**Files:**
- Modify: `src/structures/StructureRegistry.ts` (worldOffset lines only)

**Coordinate updates (find each structure by name, update its worldOffset):**

| Structure (search for name) | Line | Old worldOffset | New worldOffset |
|----------------------------|------|-----------------|-----------------|
| Obelisk | ~9325 | (22, 0, 8) | (12, 0, -8) |
| Sphinx | ~9330 | (15, 0, 80) | (30, 0, 0) |
| Colonnade | ~9339 | (0, 0, 18) | (-12, 0, -8) |
| Queen's Pyramid | ~9346 | (-24, 0, -10) | (-20, 0, -15) |
| Solar Barque | ~9353 | (25, 0, -12) | (18, 0, 10) |
| Step Pyramid of Djoser | ~9360 | (-44, 0, -30) | (-30, 0, 10) |
| Mortuary Temple | ~9367 | (20, 0, -38) | (0, 0, 18) |
| Mastaba Tomb | ~9374 | (-18, 0, -30) | (-25, 0, -8) |
| Pylon Gate | ~9381 | (0, 0, -24) | (0, 0, -25) |

**Step 1:** Update each `worldOffset: new THREE.Vector3(...)` to the new coordinates.

**Step 2: Commit**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: reposition Zone 1 — sacred monumental core"
```

---

## Task 4: Reposition Zone 2 — Temple District

**Coordinate updates:**

| Structure | Old worldOffset | New worldOffset |
|-----------|-----------------|-----------------|
| Hypostyle Hall | (40, 0, -22) | (40, 0, 35) |
| Sacred Lake | (-32, 0, 25) | (-30, 0, 42) |
| Altar of Offerings | (44, 0, -48) | (20, 0, 40) |
| Valley Temple | (-55, 0, -10) | (0, 0, -60) |
| Shrine of Anubis | (-62, 0, -52) | (-55, 0, -35) |
| Colossi of Memnon | (-72, 0, -25) | (15, 0, -40) |
| Canopic Shrine | (58, 0, -58) | (-55, 0, -15) |
| Cliff Temple | (-80, 0, 50) | (45, 0, -30) |
| Lighthouse of Pharos | (75, 0, -85) | (60, 0, 55) |
| Sed Festival Pavilion | (55, 0, -40) | (35, 0, 45) |
| Observatory | (65, 0, -55) | (55, 0, 20) |
| Nilometer | (48, 0, 52) | (30, 0, 60) |
| Karnak Precinct Wall | (95, 0, -30) | (0, 0, 55) |
| Temple of Ptah | (-85, 0, 70) | (-50, 0, 0) |
| Temple of Hathor | (-80, 0, -40) | (0, 0, -50) |
| Temple of Luxor | (115, 0, -70) | (50, 0, 0) |
| Temple of Amun-Ra | (130, 0, -40) | (0, 0, 50) |
| Karnak Hypostyle Hall | (145, 0, -20) | (40, 0, 35) |
| Temple of Dendera | (150, 0, 45) | (-40, 0, 35) |
| Hatshepsut's Terrace Temple | (-100, 0, -85) | (-45, 0, -30) |

Note: Karnak Hypostyle Hall and Hypostyle Hall have similar positions — offset Karnak slightly: (45, 0, 40) to avoid overlap.

**Commit:**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: reposition Zone 2 — temple district ring"
```

---

## Task 5: Reposition Zone 3 — Civic & Residential Quarter

**Coordinate updates:**

| Structure | Old worldOffset | New worldOffset |
|-----------|-----------------|-----------------|
| Worker Hovels | (70, 0, 48) | (105, 0, 50) |
| Craftsmen Quarter | (78, 0, 62) | (70, 0, 38) |
| Pharaoh's Palace | (68, 0, 82) | (75, 0, 55) |
| Mud Brick Tenements | (100, 0, 58) | (110, 0, 55) |
| Grand Bazaar | (90, 0, 78) | (80, 0, 42) |
| Noble Villa | (110, 0, 72) | (100, 0, 60) |
| Government Hall | (80, 0, 100) | (85, 0, 50) |
| Royal Treasury | already near (80,100) | (90, 0, 55) |
| Embalmer's Workshop | (-45, 0, 48) | (65, 0, 35) |
| Scribes' Academy | (55, 0, -40) → | (95, 0, 45) |
| Chariot Stable | (55, 0, -65) → | (95, 0, 65) |
| Brewery & Bakery | (60, 0, 25) | (75, 0, 35) |
| Military Garrison (was Guard Barracks) | (-55, 0, -20) | (100, 0, 70) |
| Priests' Residences | (-65, 0, 35) | (65, 0, 48) |
| Weaving Mill | (-75, 0, 55) | (85, 0, 38) |
| Small Market | (92, 0, 42) | (70, 0, 72) |

**Commit:**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: reposition Zone 3 — civic and residential quarter"
```

---

## Task 6: Reposition Zone 4 — Harbor & Trade District

**Coordinate updates:**

| Structure | Old worldOffset | New worldOffset |
|-----------|-----------------|-----------------|
| Grand Harbor (was Nile Harbor) | (105, 0, 50) | (80, 0, 78) |
| Stone Wharf | (80, 0, 40) | (60, 0, 75) |
| Marketplace | (55, 0, -75) | (95, 0, 75) |
| Royal Granary (was Granary) | (-50, 0, 35) | (85, 0, 72) |
| Irrigation Canal | (0, 0, -65) | (40, 0, 70) |
| The Great Quarry | (-62, 0, -52) | (110, 0, 78) |

**Commit:**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: reposition Zone 4 — harbor and trade district along Nile"
```

---

## Task 7: Reposition Zone 5 — Southern Necropolis

**Coordinate updates:**

| Structure | Old worldOffset | New worldOffset |
|-----------|-----------------|-----------------|
| Grand Processional Avenue (was Processional Way) | (0, 0, -80) | (0, 0, -45) |
| Sphinx Avenue Gate | (0, 0, 42) | (0, 0, -35) |
| Great Temple of Abu Simbel | (0, 0, -100) | (0, 0, -85) |
| Valley of Kings Entrance | (-95, 0, 90) | (-20, 0, -100) |
| Grand Necropolis (was Necropolis District) | (-120, 0, 75) | (0, 0, -110) |
| Pharaoh Mortuary Complex | (120, 0, 80) | (20, 0, -95) |
| Sarcophagus Chamber | (-55, 0, 70) | (-15, 0, -80) |
| Animal Necropolis | (-40, 0, 55) | (15, 0, -75) |
| Great Enclosure Wall | (-115, 0, -50) | (0, 0, -120) |
| Eternal City | (0, 0, 85) | (0, 0, -140) |
| Royal Palace Complex | (-130, 0, -80) | (-25, 0, -115) |
| Festival Hall of Thutmose | (-135, 0, 40) | (25, 0, -70) |
| Theban Acropolis | (0, 0, -150) | (0, 0, -150) |

**Commit:**

```bash
git add src/structures/StructureRegistry.ts
git commit -m "feat: reposition Zone 5 — southern necropolis and processional axis"
```

---

## Task 8: Visual Verification & Adjustments

**Step 1: Run the app**

```bash
cd /Users/craigverzosa/Documents/Personal/Vibes/Claude/Pyramid && npm run dev
```

**Step 2: Check each zone visually**

Open the browser and use camera controls to inspect:
- [ ] Zone 1: Pyramid, Sphinx (facing east), Queen's Pyramid, obelisks visible as a tight monumental cluster
- [ ] Zone 2: Temples ring visible around the sacred core
- [ ] Zone 3: City buildings clustered northeast toward the Nile
- [ ] Zone 4: Harbor structures along the riverbank (z~78)
- [ ] Zone 5: Necropolis stretching south with processional axis
- [ ] No structures overlapping (blocks interpenetrating)
- [ ] No structures floating above terrain (terrain flatten zones covering all build areas)
- [ ] Oasis still visible and not blocked by structures
- [ ] Nile River visible with harbor structures along it

**Step 3: Fix any overlaps or terrain issues**

If structures overlap, adjust worldOffset by 5-10 units. If terrain is bumpy under a structure, expand the corresponding flatten zone radius.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Egyptian civilization layout — 5 zones, 64 structures"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Terrain flattening zones | `terrainHeight.ts`, `SceneManager.ts` |
| 2 | Consolidate 5 structures (69→64) | `StructureRegistry.ts` |
| 3 | Zone 1: Sacred core (9 structures) | `StructureRegistry.ts` |
| 4 | Zone 2: Temple district (~20 structures) | `StructureRegistry.ts` |
| 5 | Zone 3: Civic quarter (~16 structures) | `StructureRegistry.ts` |
| 6 | Zone 4: Harbor district (~6 structures) | `StructureRegistry.ts` |
| 7 | Zone 5: Necropolis (~13 structures) | `StructureRegistry.ts` |
| 8 | Visual verification + fixes | All modified files |

8 commits building the layout zone by zone, with a final verification pass.
