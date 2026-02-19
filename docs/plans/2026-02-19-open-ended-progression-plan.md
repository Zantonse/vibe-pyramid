# Open-Ended Visual Progression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the milestone system beyond 6 levels with open-ended progression. After the pyramid completes (levels 0-5), enhance it (levels 6-8), then build surrounding structures (levels 9+) block-by-block.

**Architecture:** Extend MILESTONES, ERA_VISUALS, and ATMOSPHERE_CONFIGS arrays to support 14 defined levels + formula-based scaling beyond. Phase 2 (pyramid enhancement) stays visual-only (no new structure building — just new milestones with visual effects handled via ERA_VISUALS and atmosphere). Phase 3 will be deferred to a future implementation since it requires BuildManager/StructureRegistry architecture.

**Tech Stack:** Three.js, TypeScript, Express, WebSocket

**Note:** This plan implements **only Phase 2 (levels 6-8)** with the foundation for open-ended XP scaling. Phase 3 (structure building) is out of scope for this plan due to complexity.

---

### Task 1: Extend milestones, era visuals, and atmosphere configs for levels 6-13

**Files:**
- Modify: `shared/types.ts:22-29` (extend MILESTONES)
- Modify: `shared/types.ts:43-56` (extend ERA_VISUALS)
- Modify: `src/scene/SceneManager.ts:12-19` (extend ATMOSPHERE_CONFIGS)
- Modify: `src/audio/BlockAudio.ts:65-120` (extend playLevelUp audio)

**Step 1: Extend MILESTONES array**

In `shared/types.ts` after line 28, add levels 6-13:

```typescript
export const MILESTONES: Milestone[] = [
  { name: 'Surveying the Sands', xpThreshold: 0, icon: '\u{1F3DC}' },
  { name: 'Laying Foundations', xpThreshold: 50, icon: '\u{1F9F1}' },
  { name: 'Rising Walls', xpThreshold: 500, icon: '\u{1F3D7}' },
  { name: 'Inner Chambers', xpThreshold: 2000, icon: '\u{1F3FA}' },
  { name: 'Gilding the Facade', xpThreshold: 5000, icon: '\u{2728}' },
  { name: 'Placing the Capstone', xpThreshold: 7500, icon: '\u{1F3DB}' },
  { name: 'Sheathing in Limestone', xpThreshold: 10000, icon: '\u{1F9F1}' },
  { name: 'Inscribing the Ages', xpThreshold: 15000, icon: '\u{1F4DC}' },
  { name: 'Crown of Gold', xpThreshold: 20000, icon: '\u{1F451}' },
  { name: 'Raising the Obelisk', xpThreshold: 27500, icon: '\u{1F5FC}' },
  { name: 'Guardian of the Sands', xpThreshold: 37500, icon: '\u{1F9A4}' },
  { name: 'Path of the Gods', xpThreshold: 50000, icon: '\u{1F6E4}' },
  { name: 'Pyramid of the Queen', xpThreshold: 65000, icon: '\u{1F53A}' },
  { name: 'Solar Barque', xpThreshold: 85000, icon: '\u{26F5}' },
];
```

**Step 2: Extend ERA_VISUALS array**

After line 55 in `shared/types.ts`, add eras 6-13:

```typescript
export const ERA_VISUALS: EraVisual[] = [
  // ... existing 0-5 ...
  // Level 6: Sheathing in Limestone — smooth white limestone
  { hue: 0.12, hueRange: 0.02, saturation: 0.15, saturationRange: 0.08, lightness: 0.85, lightnessRange: 0.05, roughness: 0.5, metalness: 0.1, emissiveIntensity: 0 },
  // Level 7: Inscribing the Ages — decorated warm stone
  { hue: 0.11, hueRange: 0.02, saturation: 0.25, saturationRange: 0.08, lightness: 0.75, lightnessRange: 0.06, roughness: 0.45, metalness: 0.15, emissiveIntensity: 0.05 },
  // Level 8: Crown of Gold — pure gold
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  // Level 9: Raising the Obelisk (reuse era 8 visuals for now — structure building deferred)
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  // Levels 10-13: Same as level 9 (placeholder for future structure building)
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
  { hue: 0.13, hueRange: 0.015, saturation: 0.8, saturationRange: 0.08, lightness: 0.7, lightnessRange: 0.06, roughness: 0.2, metalness: 0.6, emissiveIntensity: 0.2 },
];
```

**Step 3: Extend ATMOSPHERE_CONFIGS**

In `src/scene/SceneManager.ts` line 12-19, extend the array:

```typescript
const ATMOSPHERE_CONFIGS: AtmosphereConfig[] = [
  // ... existing 0-5 ...
  { midColorBoost: 0.6, ambientBoost: 0.28, sunIntensityBoost: 0.32, innerGlow: true, capstoneBeacon: true },  // L6
  { midColorBoost: 0.65, ambientBoost: 0.3, sunIntensityBoost: 0.35, innerGlow: true, capstoneBeacon: true },  // L7
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },   // L8
  // Levels 9-13: Maintain level 8 atmosphere (no further escalation needed)
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
  { midColorBoost: 0.7, ambientBoost: 0.35, sunIntensityBoost: 0.4, innerGlow: true, capstoneBeacon: true },
];
```

**Step 4: Extend audio playLevelUp**

The `playLevelUp` function in `src/audio/BlockAudio.ts` uses `tierIndex` to select frequencies. The baseFreqs and thirdFreqs arrays (lines 71-72) only have 5 entries. Extend them to support more levels:

```typescript
// Base frequencies rise with each tier (extended to 14 levels)
const baseFreqs = [523, 587, 659, 740, 831, 932, 1047, 1175, 1319, 1480, 1661, 1865, 2093, 2349];
const thirdFreqs = [659, 740, 831, 932, 1047, 1175, 1319, 1480, 1661, 1865, 2093, 2349, 2637, 2960];
```

And update the index bounds check:

```typescript
const idx = Math.min(tierIndex - 1, baseFreqs.length - 1);
```

Also update the `isFinalTier` check — now any tier >= 8 gets the triumphant three-note chord:

```typescript
const isFinalTier = tierIndex >= 8;
```

**Step 5: Verify — run `npx tsc --noEmit`**

Expected: no errors.

**Step 6: Commit**

```
feat: extend milestones to level 13 with era visuals and atmosphere
```

---

### Task 2: Update HUD to show progress beyond pyramid completion

**Files:**
- Modify: `src/hud/HUD.ts:140-170` (updateXP method)

**Current issue:** HUD shows progress as `blocksPlaced / totalSlots` where `totalSlots` is fixed at ~1,540 (pyramid completion). After the pyramid completes, this shows 100% forever even though XP continues to rise.

**Solution:** Change the progress bar to represent XP progress toward the next milestone rather than physical block progress.

**Step 1: Rewrite progress bar logic in updateXP**

Replace lines 158-162:

```typescript
const progress = totalSlots > 0 ? (blocksPlaced / totalSlots) * 100 : 0;
const fillElement = this.progressBar.querySelector('div') as HTMLElement;
if (fillElement) {
  fillElement.style.width = `${progress}%`;
}
```

With:

```typescript
// Progress bar shows XP progress toward next milestone (not block completion)
let progress = 0;
if (nextMilestone) {
  const currentThreshold = milestone.xpThreshold;
  const nextThreshold = nextMilestone.xpThreshold;
  const xpIntoCurrentLevel = totalXp - currentThreshold;
  const xpNeededForNextLevel = nextThreshold - currentThreshold;
  progress = xpIntoCurrentLevel > 0 && xpNeededForNextLevel > 0
    ? (xpIntoCurrentLevel / xpNeededForNextLevel) * 100
    : 0;
} else {
  // At max level, show 100%
  progress = 100;
}

const fillElement = this.progressBar.querySelector('div') as HTMLElement;
if (fillElement) {
  fillElement.style.width = `${Math.min(progress, 100)}%`;
}
```

**Step 2: Update stats bar text to remove block count after pyramid completes**

Optionally, after the pyramid is complete (blocksPlaced >= totalSlots), you could simplify the HUD text. But for now, keep it as-is so users can see the pyramid remains full.

**Step 3: Verify — reload page, progress bar should now reset per milestone**

**Step 4: Commit**

```
feat: HUD progress bar shows XP toward next milestone
```

---

### Task 3: Add visual enhancement meshes for Phase 2 (levels 6-8)

**Files:**
- Modify: `src/scene/SceneManager.ts` (add enhancement mesh management)

This task adds the visual enhancements described in Phase 2:
- **Level 6:** Smooth white limestone casing on visible pyramid faces
- **Level 7:** Glowing entrance portal + flanking torches
- **Level 8:** Gold capstone mesh at apex + golden aura halo

**Step 1: Add private fields for enhancement meshes**

After line 39 in `src/scene/SceneManager.ts`, add:

```typescript
private limestoneCasing: THREE.Mesh | null = null;
private entrancePortal: THREE.Mesh | null = null;
private torchLights: THREE.PointLight[] = [];
private goldCapstone: THREE.Mesh | null = null;
private pyramidAura: THREE.Mesh | null = null;
```

**Step 2: Add createLimestoneCasing method**

```typescript
private createLimestoneCasing(): void {
  if (this.limestoneCasing) return;

  // Thin box shells on visible pyramid faces (front/back/left/right)
  const casingGeo = new THREE.BoxGeometry(21, 10.5, 0.1);
  const casingMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc, // beige/limestone
    roughness: 0.5,
    metalness: 0.1,
  });

  // Create a group to hold all 4 faces
  const group = new THREE.Group();

  // Front face
  const front = new THREE.Mesh(casingGeo, casingMat);
  front.position.set(0, 5.25, 10.55);
  group.add(front);

  // Back face
  const back = new THREE.Mesh(casingGeo, casingMat);
  back.position.set(0, 5.25, -10.55);
  back.rotation.y = Math.PI;
  group.add(back);

  // Left face
  const left = new THREE.Mesh(casingGeo, casingMat);
  left.position.set(-10.55, 5.25, 0);
  left.rotation.y = Math.PI / 2;
  group.add(left);

  // Right face
  const right = new THREE.Mesh(casingGeo, casingMat);
  right.position.set(10.55, 5.25, 0);
  right.rotation.y = -Math.PI / 2;
  group.add(right);

  this.scene.add(group);
  this.limestoneCasing = group as unknown as THREE.Mesh; // Store as mesh for disposal
}

private removeLimestoneCasing(): void {
  if (this.limestoneCasing) {
    this.scene.remove(this.limestoneCasing);
    this.limestoneCasing = null;
  }
}
```

**Step 3: Add createEntrancePortal method**

```typescript
private createEntrancePortal(): void {
  if (this.entrancePortal) return;

  // Glowing doorway at ground level on front face
  const portalGeo = new THREE.PlaneGeometry(2, 3);
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 0.6,
  });
  const portal = new THREE.Mesh(portalGeo, portalMat);
  portal.position.set(0, 1.5, 10.6); // Front face, ground level
  this.scene.add(portal);
  this.entrancePortal = portal;

  // Flanking torches (two point lights)
  const leftTorch = new THREE.PointLight(0xff8800, 1.5, 8, 2);
  leftTorch.position.set(-1.5, 2, 11);
  this.scene.add(leftTorch);
  this.torchLights.push(leftTorch);

  const rightTorch = new THREE.PointLight(0xff8800, 1.5, 8, 2);
  rightTorch.position.set(1.5, 2, 11);
  this.scene.add(rightTorch);
  this.torchLights.push(rightTorch);
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
```

**Step 4: Add createGoldCapstone method**

```typescript
private createGoldCapstone(): void {
  if (this.goldCapstone) return;

  // Gold pyramid cap at apex
  const capGeo = new THREE.ConeGeometry(1.5, 1.5, 4);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.7,
    emissive: 0xffd700,
    emissiveIntensity: 0.3,
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.set(0, 11.25, 0); // Top of pyramid
  this.scene.add(cap);
  this.goldCapstone = cap;

  // Golden aura halo (larger transparent sphere)
  const auraGeo = new THREE.SphereGeometry(12, 16, 16);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.position.set(0, 5, 0);
  this.scene.add(aura);
  this.pyramidAura = aura;
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
```

**Step 5: Update setMilestoneLevel to manage enhancements**

In `setMilestoneLevel` (after the capstone beacon logic, around line 233), add:

```typescript
// Phase 2 enhancements
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
```

**Step 6: Verify — manually set milestone to 6, 7, 8 and confirm visuals appear**

**Step 7: Commit**

```
feat: add Phase 2 visual enhancements (casing, entrance, gold cap)
```

---

### Task 4: Update sand particle colors for levels 6-8

**Files:**
- Modify: `src/effects/SandParticles.ts:10-17` (extend SAND_COLORS)

**Step 1: Extend SAND_COLORS array**

Replace the array with extended entries:

```typescript
private static readonly SAND_COLORS: THREE.Color[] = [
  new THREE.Color(0xd5a574), // L0: default sand
  new THREE.Color(0xd5a574), // L1: default sand
  new THREE.Color(0xd5a574), // L2: default sand
  new THREE.Color(0xdbb070), // L3: faint gold tint
  new THREE.Color(0xe0b850), // L4: golden dust
  new THREE.Color(0xffd700), // L5: bright golden sparkle
  new THREE.Color(0xffd700), // L6: maintain golden
  new THREE.Color(0xffd700), // L7: maintain golden
  new THREE.Color(0xffd700), // L8: maintain golden
  // Levels 9-13: same as 8
  new THREE.Color(0xffd700),
  new THREE.Color(0xffd700),
  new THREE.Color(0xffd700),
  new THREE.Color(0xffd700),
  new THREE.Color(0xffd700),
];
```

**Step 2: Verify — run `npx tsc --noEmit`**

**Step 3: Commit**

```
feat: extend sand particle colors for levels 6-13
```

---

### Task 5: Update PyramidBuilder to support more eras

**Files:**
- Modify: `src/pyramid/PyramidBuilder.ts:48-63` (constructor loop bounds)

**Current issue:** The PyramidBuilder constructor loops `for (let i = 0; i < ERA_VISUALS.length; i++)` to create era meshes. This already handles arbitrary ERA_VISUALS lengths, so **no change needed** — it will automatically create meshes for the new eras.

**Verification:** Check that the constructor already handles dynamic era count.

**Step 1: Read PyramidBuilder constructor — confirm it loops over ERA_VISUALS.length**

Line 48: `for (let i = 0; i < ERA_VISUALS.length; i++)`

✅ Already correct. The array expansion in Task 1 is sufficient.

**Step 2: No code change needed**

Skip this task — the code is already flexible.

---

### Task 6: Test end-to-end with all changes

**Verification steps:**

1. **Start the servers:**
   ```bash
   npm run dev:server  # Terminal 1
   npm run dev         # Terminal 2
   ```

2. **Check milestone 6 (10,000 XP):**
   - Manually edit `~/.pyramid/state.json`, set `"total_xp": 10000`, save
   - Restart backend: `npm run dev:server`
   - Reload page at `http://localhost:4201/`
   - Confirm: Limestone casing visible on pyramid faces

3. **Check milestone 7 (15,000 XP):**
   - Edit state.json to `"total_xp": 15000`
   - Restart backend, reload page
   - Confirm: Entrance portal glowing, torches flanking

4. **Check milestone 8 (20,000 XP):**
   - Edit state.json to `"total_xp": 20000`
   - Restart backend, reload page
   - Confirm: Gold capstone at apex, golden aura halo around pyramid

5. **Check milestone 9+ (27,500 XP):**
   - Edit state.json to `"total_xp": 30000`
   - Restart backend, reload page
   - Confirm: Level 9 milestone name appears in HUD, visuals remain at level 8 (placeholder)

6. **Check HUD progress bar:**
   - At each level, confirm progress bar resets and fills toward next milestone
   - At level 13 (max defined), confirm progress bar shows 100%

7. **Check audio:**
   - Level up from 7,500 XP → 10,000 XP
   - Confirm: Level-up chime plays with higher frequency

**Step 1: Run all verification steps**

**Step 2: Commit**

```
chore: verify Phase 2 visual progression implementation
```

---

## Summary

This plan implements **Phase 2 only**: levels 6-8 with visual enhancements to the pyramid (limestone casing, entrance portal, gold capstone). The foundation for levels 9-13 is in place (milestones, era visuals, atmosphere) but **Phase 3 (structure building)** is deferred to a future implementation.

**What's implemented:**
- 14 milestone levels (0-13) with XP thresholds
- 14 ERA_VISUALS entries (levels 9-13 reuse level 8 visuals)
- 14 ATMOSPHERE_CONFIGS entries (levels 9-13 maintain level 8 atmosphere)
- Extended audio frequencies for all levels
- HUD progress bar shows XP-to-next-milestone instead of block completion
- Phase 2 visual meshes (casing, portal, capstone, aura)

**What's deferred:**
- BuildManager/StructureRegistry architecture
- Obelisk, Sphinx, Colonnade, SmallPyramid, Boat structure generators
- Multi-structure scene composition
- Per-structure block placement routing
